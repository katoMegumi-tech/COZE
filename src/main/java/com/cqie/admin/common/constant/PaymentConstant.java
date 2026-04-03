package com.cqie.admin.common.constant;

/**
 * 支付相关常量
 */
public class PaymentConstant {

    /**
     * 支付方式：微信支付
     */
    public static final String PAY_TYPE_WECHAT = "WECHAT";

    /**
     * 支付状态：待支付
     */
    public static final Integer PAY_STATUS_PENDING = 0;

    /**
     * 支付状态：支付成功
     */
    public static final Integer PAY_STATUS_SUCCESS = 1;

    /**
     * 支付状态：支付失败
     */
    public static final Integer PAY_STATUS_FAILED = 2;

    /**
     * 支付状态：已关闭
     */
    public static final Integer PAY_STATUS_CLOSED = 3;

    /**
     * 微信支付成功返回码
     */
    public static final String WECHAT_RETURN_SUCCESS = "SUCCESS";

    /**
     * 微信支付失败返回码
     */
    public static final String WECHAT_RETURN_FAIL = "FAIL";

    /**
     * 签名类型：MD5
     */
    public static final String SIGN_TYPE_MD5 = "MD5";
}
