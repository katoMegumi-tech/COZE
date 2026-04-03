package com.cqie.admin.controller;

import com.cqie.admin.dto.request.PaymentCreateRequest;
import com.cqie.admin.dto.response.PaymentCreateResponse;
import com.cqie.admin.service.PaymentService;
import com.cqie.generate_video.result.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.util.Map;

/**
 * 支付Controller
 */
@RestController
@RequestMapping("/api/payment")
@Tag(name = "支付管理", description = "微信支付相关接口")
@Slf4j
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * 创建支付订单
     *
     * @param request 支付请求参数
     * @return 支付参数
     */
    @Operation(summary = "创建支付订单", description = "创建微信支付订单，返回前端调起支付所需的参数")
    @PostMapping("/create")
    public Result<PaymentCreateResponse> createPayment(@Valid @RequestBody PaymentCreateRequest request) {
        log.info("创建支付订单请求: orderId={}, amount={}, payType={}", 
                request.getOrderId(), request.getAmount(), request.getPayType());
        PaymentCreateResponse response = paymentService.createPayment(request);
        return Result.success(response);
    }

    /**
     * 微信支付结果通知回调
     *
     * @param request HTTP请求
     * @return 处理结果XML
     */
    @Operation(summary = "微信支付回调", description = "微信支付结果异步通知接口")
    @PostMapping("/notify")
    public String handlePayNotify(HttpServletRequest request) {
        log.info("收到微信支付回调通知");
        String notifyData = readRequestBody(request);
        return paymentService.handlePayNotify(notifyData);
    }

    /**
     * 查询订单支付状态
     *
     * @param orderNo 订单号
     * @return 订单状态
     */
    @Operation(summary = "查询订单状态", description = "查询支付订单的当前状态")
    @GetMapping("/status/{orderNo}")
    public Result<Map<String, Object>> queryOrderStatus(@PathVariable String orderNo) {
        log.info("查询订单状态: {}", orderNo);
        Map<String, Object> status = paymentService.queryOrderStatus(orderNo);
        return Result.success(status);
    }

    /**
     * 读取请求体
     */
    private String readRequestBody(HttpServletRequest request) {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        } catch (Exception e) {
            log.error("读取请求体失败", e);
        }
        return sb.toString();
    }
}
