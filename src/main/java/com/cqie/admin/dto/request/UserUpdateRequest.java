package com.cqie.admin.dto.request;

import lombok.Data;

@Data
public class UserUpdateRequest {

    //TODO 暂时只能修改名称

    // 昵称
    private String nickname;
}
