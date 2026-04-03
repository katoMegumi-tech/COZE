package com.cqie.admin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

import java.util.Date;

/**
 * 支付订单实体类
 */
@EqualsAndHashCode(callSuper = true)
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@TableName("payment_order")
public class PaymentOrderDO extends BaseDO {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 商户订单号
     */
    private String orderNo;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 用户微信openid
     */
    private String openid;

    /**
     * 支付金额（分）
     */
    private Integer amount;

    /**
     * 商品描述
     */
    private String body;

    /**
     * 支付方式：WECHAT-微信支付
     */
    private String payType;

    /**
     * 支付状态：0-待支付，1-支付成功，2-支付失败，3-已关闭
     */
    private Integer status;

    /**
     * 微信预支付ID
     */
    private String prepayId;

    /**
     * 微信支付订单号
     */
    private String transactionId;

    /**
     * 支付完成时间
     */
    private Date payTime;

    /**
     * 支付回调结果
     */
    private String notifyResult;

    /**
     * 产品类型：MEMBER-会员购买，POINTS_PACKAGE-积分加油包
     */
    private String productType;

    /**
     * 产品编码（会员等级或加油包类型）
     */
    private String productCode;
}
