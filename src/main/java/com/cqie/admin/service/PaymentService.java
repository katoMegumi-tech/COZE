package com.cqie.admin.service;

import com.cqie.admin.dto.request.PaymentCreateRequest;
import com.cqie.admin.dto.response.PaymentCreateResponse;

import java.util.Map;

/**
 * 支付服务接口
 */
public interface PaymentService {

    /**
     * 创建支付订单
     *
     * @param request 支付请求参数
     * @return 支付参数
     */
    PaymentCreateResponse createPayment(PaymentCreateRequest request);

    /**
     * 处理微信支付回调通知
     *
     * @param notifyData 回调数据
     * @return 处理结果
     */
    String handlePayNotify(String notifyData);

    /**
     * 查询订单支付状态
     *
     * @param orderNo 订单号
     * @return 订单状态
     */
    Map<String, Object> queryOrderStatus(String orderNo);
}
