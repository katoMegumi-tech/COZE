package com.cqie.admin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@TableName("user_points_log")
public class UserPointsLogDO extends BaseDO{

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    private Integer changePoints;

    private Integer currentPoints;

    private String remark;

}
