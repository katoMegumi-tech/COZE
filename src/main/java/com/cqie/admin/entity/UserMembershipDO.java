package com.cqie.admin.entity;


import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("user_membership")
public class UserMembershipDO {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    private Integer level;

    private LocalDate currentStart;

    private LocalDate currentEnd;

    private Integer nextLevel;

    private LocalDate nextStart;

    private Integer status; // 1:生效中 2:缓冲期 3:彻底失效

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
