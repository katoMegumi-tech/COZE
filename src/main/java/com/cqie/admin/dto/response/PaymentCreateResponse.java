package com.cqie.admin.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 创建支付订单响应参数
 */
@Data
@Schema(description = "创建支付订单响应参数")
public class PaymentCreateResponse {

    @Schema(description = "时间戳", example = "1620000000")
    private String timeStamp;

    @Schema(description = "随机字符串", example = "randomString123")
    private String nonceStr;

    @JsonProperty("package")
    @Schema(description = "订单详情扩展字符串，格式：prepay_id=xxx", example = "prepay_id=wx202105041234567890")
    private String packageStr;

    @Schema(description = "签名类型", example = "MD5")
    private String signType;

    @Schema(description = "支付签名", example = "signature123")
    private String paySign;

    @Schema(description = "商户订单号", example = "ORDER202504030001")
    private String orderNo;
}
