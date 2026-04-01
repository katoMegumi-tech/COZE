package com.cqie.admin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class UserPointsLogDO extends BaseDO{

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    private Integer changePoints;

    private Integer currentPoints;

    private String remark;

}
