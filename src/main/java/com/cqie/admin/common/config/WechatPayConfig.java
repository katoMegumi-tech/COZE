package com.cqie.admin.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 微信支付配置类
 */
@Data
@Component
@ConfigurationProperties(prefix = "wechat.pay")
public class WechatPayConfig {

    /**
     * 小程序AppID
     */
    private String appId;

    /**
     * 商户号
     */
    private String mchId;

    /**
     * 商户API密钥
     */
    private String apiKey;

    /**
     * 支付结果通知地址
     */
    private String notifyUrl;

    /**
     * 交易类型
     */
    private String tradeType = "JSAPI";

    /**
     * 统一下单接口地址
     */
    public static final String UNIFIED_ORDER_URL = "https://api.mch.weixin.qq.com/pay/unifiedorder";
}
