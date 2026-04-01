package com.cqie.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.*;

import java.time.LocalDateTime;

@EqualsAndHashCode(callSuper = true)
@Data
@TableName("user_role")
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserRoleDO extends BaseDO {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("user_id")
    private Long userId;

    @TableField("role_id")
    private Integer roleId;
}
