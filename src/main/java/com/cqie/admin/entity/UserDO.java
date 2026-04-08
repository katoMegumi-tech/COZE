package com.cqie.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.Date;

@EqualsAndHashCode(callSuper = true)
@Data
@TableName("sys_user")
public class UserDO extends BaseDO {

    @TableId(type = IdType.AUTO)
    private Long id;

    // 登录账号
    private String username;

    // 密码（密文）
    private String password;

    // 昵称
    private String nickname;

    // 手机号
    private String phone;

    // 邮箱
    private String email;

    // 用户积分
    private Integer points;

    // 状态 0-禁用 1-正常
    private Integer status;

    // 微信openid
    private String openid;

}
