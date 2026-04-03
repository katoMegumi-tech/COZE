package com.cqie.admin.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 创建支付订单请求参数
 */
@Data
@Schema(description = "创建支付订单请求参数")
public class PaymentCreateRequest {

    @Schema(description = "订单ID", required = true, example = "ORDER202504030001")
    @NotBlank(message = "订单ID不能为空")
    private String orderId;

    @Schema(description = "支付金额（分）", required = true, example = "100")
    @NotNull(message = "支付金额不能为空")
    @Min(value = 1, message = "支付金额必须大于0")
    private Integer amount;

    @Schema(description = "支付方式：WECHAT-微信支付", required = true, example = "WECHAT")
    @NotBlank(message = "支付方式不能为空")
    private String payType;

    @Schema(description = "商品描述", example = "视频生成服务")
    private String body;

    @Schema(description = "用户微信openid", required = true, example = "o1234567890abcdef")
    @NotBlank(message = "用户openid不能为空")
    private String openid;
}
