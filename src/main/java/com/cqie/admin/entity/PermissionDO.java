package com.cqie.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("permission")
public class PermissionDO extends BaseDO {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("parent_id")
    private Long parentId;

    private String name;

    private String code;

    private Integer type;

    private String path;

    private String method;

    private Integer status;

    private Integer sort;

}
