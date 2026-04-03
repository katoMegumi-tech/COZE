package com.cqie.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.cqie.admin.common.config.WechatPayConfig;
import com.cqie.admin.common.constant.MemberLevelEnum;
import com.cqie.admin.common.constant.PointsPackageEnum;
import com.cqie.admin.common.constant.ProductTypeEnum;
import com.cqie.admin.common.exception.ClientException;
import com.cqie.admin.dto.request.PaymentCreateRequest;
import com.cqie.admin.dto.response.PaymentCreateResponse;
import com.cqie.admin.entity.PaymentOrderDO;
import com.cqie.admin.entity.UserDO;
import com.cqie.admin.mapper.PaymentOrderMapper;
import com.cqie.admin.mapper.UserMapper;
import com.cqie.admin.service.MemberService;
import com.cqie.admin.service.PaymentService;
import com.cqie.admin.util.WechatPayUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * 支付服务实现类
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final WechatPayConfig wechatPayConfig;
    private final PaymentOrderMapper paymentOrderMapper;
    private final UserMapper userMapper;
    private final MemberService memberService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PaymentCreateResponse createPayment(PaymentCreateRequest request) {
        // 获取当前登录用户
        String username = getCurrentUsername();
        UserDO userDO = userMapper.selectOne(
                new LambdaQueryWrapper<UserDO>().eq(UserDO::getUsername, username)
        );
        if (userDO == null) {
            throw new ClientException("500", "用户不存在");
        }

        // 验证产品类型
        ProductTypeEnum productType = ProductTypeEnum.getByCode(request.getProductType());
        if (productType == null) {
            throw new ClientException("500", "无效的产品类型");
        }

        // 根据产品类型获取价格和商品描述
        int price;
        String body;
        switch (productType) {
            case MEMBER:
                MemberLevelEnum memberLevel = MemberLevelEnum.valueOf(request.getProductCode());
                if (memberLevel == null || memberLevel == MemberLevelEnum.NORMAL) {
                    throw new ClientException("500", "无效的会员等级");
                }
                price = memberLevel.getPrice();
                body = "开通" + memberLevel.getName();
                break;
            case POINTS_PACKAGE:
                // 检查用户是否可以购买加油包
                if (!memberService.canPurchasePointsPackage(userDO.getId())) {
                    throw new ClientException("500", "体验会员无法购买积分加油包");
                }
                PointsPackageEnum pkg = PointsPackageEnum.valueOf(request.getProductCode());
                if (pkg == null) {
                    throw new ClientException("500", "无效的加油包类型");
                }
                price = pkg.getPrice();
                body = "购买" + pkg.getName();
                break;
            default:
                throw new ClientException("500", "不支持的产品类型");
        }

        // 生成商户订单号
        String orderNo = WechatPayUtil.generateOrderNo();

        // 构建统一下单请求参数
        Map<String, String> unifiedOrderParams = buildUnifiedOrderParams(price, body, orderNo, request.getOpenid());

        // 生成签名
        String sign = WechatPayUtil.generateMD5Sign(unifiedOrderParams, wechatPayConfig.getApiKey());
        unifiedOrderParams.put("sign", sign);

        // 转换为XML
        String xmlParams = WechatPayUtil.mapToXml(unifiedOrderParams);
        log.info("统一下单请求参数: {}", xmlParams);

        // 调用微信支付统一下单接口
        String responseXml;
        try {
            responseXml = callWechatApi(WechatPayConfig.UNIFIED_ORDER_URL, xmlParams);
            log.info("统一下单响应: {}", responseXml);
        } catch (Exception e) {
            log.error("调用微信支付接口失败", e);
            throw new ClientException("500", "创建支付订单失败");
        }

        // 解析响应
        Map<String, String> responseMap = WechatPayUtil.xmlToMap(responseXml);

        // 验证返回码
        String returnCode = responseMap.get("return_code");
        if (!"SUCCESS".equals(returnCode)) {
            String returnMsg = responseMap.get("return_msg");
            log.error("微信支付接口返回错误: {}", returnMsg);
            throw new ClientException("500", "创建支付订单失败: " + returnMsg);
        }

        // 验证业务结果
        String resultCode = responseMap.get("result_code");
        if (!"SUCCESS".equals(resultCode)) {
            String errCodeDes = responseMap.get("err_code_des");
            log.error("微信支付业务错误: {}", errCodeDes);
            throw new ClientException("500", "创建支付订单失败: " + errCodeDes);
        }

        // 获取预支付ID
        String prepayId = responseMap.get("prepay_id");

        // 保存订单到数据库
        PaymentOrderDO order = PaymentOrderDO.builder()
                .orderNo(orderNo)
                .userId(userDO.getId())
                .openid(request.getOpenid())
                .amount(price)
                .body(body)
                .payType(request.getPayType())
                .status(0) // 待支付
                .prepayId(prepayId)
                .productType(request.getProductType())
                .productCode(request.getProductCode())
                .build();
        paymentOrderMapper.insert(order);

        // 生成前端调起支付所需的参数
        String timeStamp = WechatPayUtil.generateTimestamp();
        String nonceStr = WechatPayUtil.generateNonceStr();
        String packageStr = "prepay_id=" + prepayId;
        String signType = "MD5";
        String paySign = WechatPayUtil.generatePaySign(
                wechatPayConfig.getAppId(),
                timeStamp,
                nonceStr,
                packageStr,
                signType,
                wechatPayConfig.getApiKey()
        );

        // 构建响应
        PaymentCreateResponse response = new PaymentCreateResponse();
        response.setTimeStamp(timeStamp);
        response.setNonceStr(nonceStr);
        response.setPackageStr(packageStr);
        response.setSignType(signType);
        response.setPaySign(paySign);
        response.setOrderNo(orderNo);

        return response;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String handlePayNotify(String notifyData) {
        try {
            log.info("收到微信支付回调: {}", notifyData);

            // 解析XML
            Map<String, String> notifyMap = WechatPayUtil.xmlToMap(notifyData);

            // 验证返回码
            String returnCode = notifyMap.get("return_code");
            if (!"SUCCESS".equals(returnCode)) {
                log.error("微信支付回调返回错误");
                return buildReturnXml("FAIL", "回调处理失败");
            }

            // 验证签名
            String sign = notifyMap.get("sign");
            if (!WechatPayUtil.verifyMD5Sign(notifyMap, wechatPayConfig.getApiKey(), sign)) {
                log.error("微信支付回调签名验证失败");
                return buildReturnXml("FAIL", "签名验证失败");
            }

            // 获取订单信息
            String orderNo = notifyMap.get("out_trade_no");
            String transactionId = notifyMap.get("transaction_id");
            String resultCode = notifyMap.get("result_code");

            // 查询订单
            PaymentOrderDO order = paymentOrderMapper.selectByOrderNo(orderNo);
            if (order == null) {
                log.error("订单不存在: {}", orderNo);
                return buildReturnXml("FAIL", "订单不存在");
            }

            // 如果订单已处理，直接返回成功
            if (order.getStatus() == 1) {
                return buildReturnXml("SUCCESS", "OK");
            }

            // 更新订单状态
            Integer status = "SUCCESS".equals(resultCode) ? 1 : 2;
            Date payTime = new Date();

            paymentOrderMapper.updateOrderStatus(
                    orderNo,
                    status,
                    transactionId,
                    payTime,
                    notifyData
            );

            // 支付成功后处理业务逻辑
            if ("SUCCESS".equals(resultCode)) {
                processPaymentSuccess(order);
            }

            log.info("订单状态更新成功: {}, status: {}", orderNo, status);

            return buildReturnXml("SUCCESS", "OK");
        } catch (Exception e) {
            log.error("处理支付回调异常", e);
            return buildReturnXml("FAIL", "处理异常");
        }
    }

    @Override
    public Map<String, Object> queryOrderStatus(String orderNo) {
        PaymentOrderDO order = paymentOrderMapper.selectByOrderNo(orderNo);
        if (order == null) {
            throw new ClientException("500", "订单不存在");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("orderNo", order.getOrderNo());
        result.put("status", order.getStatus());
        result.put("amount", order.getAmount());
        result.put("payTime", order.getPayTime());
        result.put("transactionId", order.getTransactionId());

        return result;
    }

    /**
     * 构建统一下单请求参数
     */
    private Map<String, String> buildUnifiedOrderParams(int amount, String body, String orderNo, String openid) {
        Map<String, String> params = new HashMap<>();
        params.put("appid", wechatPayConfig.getAppId());
        params.put("mch_id", wechatPayConfig.getMchId());
        params.put("nonce_str", WechatPayUtil.generateNonceStr());
        params.put("body", body);
        params.put("out_trade_no", orderNo);
        params.put("total_fee", String.valueOf(amount));
        params.put("spbill_create_ip", "127.0.0.1"); // 客户端IP，实际应从请求中获取
        params.put("notify_url", wechatPayConfig.getNotifyUrl());
        params.put("trade_type", wechatPayConfig.getTradeType());
        params.put("openid", openid);
        return params;
    }

    /**
     * 处理支付成功后的业务逻辑
     */
    private void processPaymentSuccess(PaymentOrderDO order) {
        try {
            ProductTypeEnum productType = ProductTypeEnum.getByCode(order.getProductType());
            if (productType == null) {
                log.error("无效的产品类型: {}", order.getProductType());
                return;
            }

            switch (productType) {
                case MEMBER:
                    MemberLevelEnum memberLevel = MemberLevelEnum.valueOf(order.getProductCode());
                    if (memberLevel != null) {
                        memberService.openMember(order.getUserId(), memberLevel);
                    }
                    break;
                case POINTS_PACKAGE:
                    PointsPackageEnum pkg = PointsPackageEnum.valueOf(order.getProductCode());
                    if (pkg != null) {
                        memberService.purchasePointsPackage(order.getUserId(), pkg);
                    }
                    break;
                default:
                    log.error("不支持的产品类型: {}", productType);
            }
        } catch (Exception e) {
            log.error("处理支付成功业务逻辑失败", e);
        }
    }

    /**
     * 调用微信支付API
     */
    private String callWechatApi(String url, String xmlParams) throws Exception {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost httpPost = new HttpPost(url);
            httpPost.setHeader("Content-Type", "application/xml");
            httpPost.setEntity(new StringEntity(xmlParams, StandardCharsets.UTF_8));

            try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
                return EntityUtils.toString(response.getEntity(), StandardCharsets.UTF_8);
            }
        }
    }

    /**
     * 构建返回XML
     */
    private String buildReturnXml(String returnCode, String returnMsg) {
        return "<xml>" +
                "<return_code><![CDATA[" + returnCode + "]]></return_code>" +
                "<return_msg><![CDATA[" + returnMsg + "]]></return_msg>" +
                "</xml>";
    }

    /**
     * 获取当前登录用户名
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new ClientException("500", "用户未登录");
        }
        return authentication.getName();
    }
}
