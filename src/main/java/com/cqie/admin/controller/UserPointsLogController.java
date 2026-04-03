package com.cqie.admin.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.cqie.admin.dto.response.PointsLogResponse;
import com.cqie.admin.entity.UserPointsLogDO;
import com.cqie.admin.service.UserPointsLogService;
import com.cqie.admin.util.BeanUtil;
import com.cqie.generate_video.result.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/points-log")
@Tag(name = "积分日志", description = "用户积分变更记录查询接口")
public class UserPointsLogController {

    @Autowired
    private UserPointsLogService userPointsLogService;

    /**
     * 分页查询当前用户的积分日志
     *
     * @param current 当前页码
     * @param size    每页大小
     * @return 分页积分日志列表
     */
    @Operation(summary = "分页查询积分日志", description = "查询当前登录用户的积分变更记录")
    @PreAuthorize("hasAuthority('user:getPointInfo')")
    @GetMapping("/page")
    public Result<IPage<PointsLogResponse>> getPointsLogPage(
            @Parameter(description = "当前页码", example = "1")
            @RequestParam(defaultValue = "1") long current,
            @Parameter(description = "每页大小", example = "10")
            @RequestParam(defaultValue = "10") long size) {
        IPage<UserPointsLogDO> pageResult = userPointsLogService.getPointsLogPage(current, size);

        // 转换 DO 到 Response
        List<PointsLogResponse> records = pageResult.getRecords().stream()
                .map(log -> BeanUtil.convert(log, PointsLogResponse.class))
                .collect(Collectors.toList());

        // 构建新的分页结果
        IPage<PointsLogResponse> responsePage = new com.baomidou.mybatisplus.extension.plugins.pagination.Page<>(
                pageResult.getCurrent(), pageResult.getSize(), pageResult.getTotal()
        );
        responsePage.setRecords(records);

        return Result.success(responsePage);
    }
}
