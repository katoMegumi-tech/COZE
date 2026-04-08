package com.cqie.admin.entity;


import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("user_points_account")
@Schema(description = "用户积分账户")
public class UserPointsAccountDO {
    @TableId

    private String username;

    private Integer monthlyPoints;

    private Integer extraPoints;

    private LocalDate extraExpireAt;

    private LocalDateTime updatedAt;
}
