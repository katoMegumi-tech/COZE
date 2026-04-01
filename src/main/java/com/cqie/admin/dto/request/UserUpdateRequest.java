package com.cqie.admin.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Schema(description = "用户更新请求参数")
@Data
public class UserUpdateRequest {

    //TODO 暂时只能修改名称

    @Schema(description = "昵称", example = "管理员")
    // 昵称
    private String nickname;
}
