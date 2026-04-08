package com.cqie.admin.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.Map;

@Schema(description = "会员调试响应")
@Data
public class MembershipDebugResponse {

    @Schema(description = "是否成功", example = "true")
    private boolean ok;

    @Schema(description = "动作名称", example = "buyMember")
    private String action;

    @Schema(description = "用户名", example = "test02")
    private String username;

    @Schema(description = "提示信息", example = "操作成功")
    private String message;

    @Schema(description = "附加数据")
    private Map<String, Object> data;
}
