package com.cqie.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class UserLoginResponse {
    // 登录账号
    private String username;

    // 昵称
    private String nickname;

    // 手机号
    private String phone;

    // 邮箱
    private String email;

    // 用户积分
    private Integer points;

    // 访问令牌
    private String token;

}
