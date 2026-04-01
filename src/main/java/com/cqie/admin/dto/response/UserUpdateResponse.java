package com.cqie.admin.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Schema(description = "用户更新响应")
@Data
public class UserUpdateResponse {

    @Schema(description = "昵称")
    // 昵称
    private String nickname;
}
