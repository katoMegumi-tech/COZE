package com.cqie.admin.entity;


import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("user_points_account")
public class UserPointsAccountDO {
    @TableId
    private String username;

    private Integer monthlyPoints;

    private Integer extraPoints;

    private LocalDate extraExpireAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
