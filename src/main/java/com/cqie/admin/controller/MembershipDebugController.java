package com.cqie.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.cqie.admin.common.constant.ExtraPackageConstant;
import com.cqie.admin.common.constant.MemberLevel;
import com.cqie.admin.dto.request.MembershipBuyExtraDebugRequest;
import com.cqie.admin.dto.request.MembershipConsumeDebugRequest;
import com.cqie.admin.dto.request.MembershipOpenDebugRequest;
import com.cqie.admin.dto.request.MembershipStatusDebugRequest;
import com.cqie.admin.dto.response.MembershipDebugResponse;
import com.cqie.admin.entity.UserMembershipDO;
import com.cqie.admin.entity.UserPointsAccountDO;
import com.cqie.admin.mapper.UserMembershipMapper;
import com.cqie.admin.mapper.UserPointsAccountMapper;
import com.cqie.admin.service.UserMembershipService;
import com.cqie.admin.service.UserPointsAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * 仅用于本地联调会员与积分逻辑的测试控制器。
 * 注意：上线前建议删除或加严格权限控制。
 */
@RestController
@RequestMapping("/api/debug/membership")
@RequiredArgsConstructor
@Tag(name = "会员调试", description = "本地联调会员与积分逻辑的测试接口，上线前建议删除或加严格权限控制")
public class MembershipDebugController {

    private final UserMembershipService userMembershipService;
    private final UserPointsAccountService userPointsAccountService;
    private final UserMembershipMapper userMembershipMapper;
    private final UserPointsAccountMapper userPointsAccountMapper;

    /**
     * 开通/续费/升级会员（支持预约生效）
     */
    @PostMapping("/open")
    @Operation(summary = "开通/续费/升级会员", description = "支持预约生效，传入目标会员等级进行开通")
    public MembershipDebugResponse open(@RequestBody MembershipOpenDebugRequest request) {
        String username = resolveUsername(request == null ? null : request.getUsername());
        MemberLevel level = parseLevel(request == null ? null : request.getMemberLevel());

        userMembershipService.buyMember(username, level.getCode());

        Map<String, Object> data = new HashMap<>();
        data.put("targetLevel", level.name());

        return success("buyMember", username, "开通/预约成功", data);
    }

    /**
     * 购买加油包
     */
    @PostMapping("/buy-extra")
    @Operation(summary = "购买加油包", description = "为指定用户购买积分加油包")
    public MembershipDebugResponse buyExtra(@RequestBody(required = false) MembershipBuyExtraDebugRequest request) {
        String username = resolveUsername(request == null ? null : request.getUsername());
        int points = ExtraPackageConstant.POINTS;
        if (request != null && request.getExtraPoints() != null && request.getExtraPoints() > 0) {
            points = request.getExtraPoints();
        }

        userPointsAccountService.addExtraPoints(username, points);

        Map<String, Object> data = new HashMap<>();
        data.put("points", points);

        return success("addExtraPoints", username, "加油包购买成功", data);
    }

    /**
     * 扣积分（按秒和质量）
     */
    @PostMapping("/consume")
    @Operation(summary = "扣积分", description = "按秒数和质量（std/premium）扣除积分")
    public MembershipDebugResponse consume(@RequestBody MembershipConsumeDebugRequest request) {
        String username = resolveUsername(request == null ? null : request.getUsername());
        int seconds = (request == null || request.getSeconds() == null) ? 10 : request.getSeconds();
        String quality = (request == null || request.getQuality() == null || request.getQuality().trim().isEmpty())
                ? "std"
                : request.getQuality().trim();

        userPointsAccountService.consumePoints(username, seconds, quality);

        int unit = "premium".equalsIgnoreCase(quality) ? 30 : 25;
        Map<String, Object> data = new HashMap<>();
        data.put("seconds", seconds);
        data.put("quality", quality);
        data.put("cost", seconds * unit);

        return success("consumePoints", username, "扣费成功", data);
    }

    /**
     * 查询会员与预约状态（会触发一次惰性生效）
     */
    @PostMapping("/status")
    @Operation(summary = "查询会员与预约状态", description = "查询会员状态并触发惰性生效，预约到期则自动切换")
    public MembershipDebugResponse status(@RequestBody(required = false) MembershipStatusDebugRequest request) {
        String username = resolveUsername(request == null ? null : request.getUsername());

        // 触发惰性生效（预约到期则自动切换）
        MemberLevel currentLevel = userMembershipService.getCurrentLevel(username);

        UserMembershipDO membership = userMembershipMapper.selectOne(
                new LambdaQueryWrapper<UserMembershipDO>()
                        .eq(UserMembershipDO::getUsername, username)
                        .last("limit 1")
        );

        UserPointsAccountDO account = userPointsAccountMapper.selectById(username);

        Map<String, Object> data = new HashMap<>();
        data.put("today", LocalDate.now().toString());
        data.put("currentLevel", currentLevel.name());

        if (membership == null) {
            data.put("hasMembership", false);
            return success("status", username, "查询成功", data);
        }

        data.put("hasMembership", true);
        data.put("levelCode", membership.getLevel());
        data.put("currentStart", membership.getCurrentStart());
        data.put("currentEnd", membership.getCurrentEnd());
        data.put("nextLevel", membership.getNextLevel());
        data.put("nextStart", membership.getNextStart());
        data.put("status", membership.getStatus());

        LocalDate today = LocalDate.now();
        boolean inCurrentCycle = membership.getCurrentStart() != null
                && membership.getCurrentEnd() != null
                && !today.isBefore(membership.getCurrentStart())
                && !today.isAfter(membership.getCurrentEnd());
        data.put("inCurrentCycle", inCurrentCycle);

        boolean hasSchedule = membership.getNextLevel() != null && membership.getNextStart() != null;
        data.put("hasSchedule", hasSchedule);
        data.put("scheduleShouldBeEffectiveToday", hasSchedule && !today.isBefore(membership.getNextStart()));

        if (account != null) {
            int monthly = account.getMonthlyPoints() == null ? 0 : account.getMonthlyPoints();
            int extra = account.getExtraPoints() == null ? 0 : account.getExtraPoints();
            data.put("monthlyPoints", monthly);
            data.put("extraPoints", extra);
            data.put("totalPoints", monthly + extra);
            data.put("extraExpireAt", account.getExtraExpireAt());
        }

        return success("status", username, "查询成功", data);
    }

    private String resolveUsername(String username) {
        if (username != null && !username.trim().isEmpty()) {
            return username.trim();
        }
        return "test02";
    }

    private MemberLevel parseLevel(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return MemberLevel.VIP;
        }
        String code = raw.trim().toUpperCase();
        if ("EXPERIENCE".equals(code)) {
            code = "TRIAL";
        }
        return MemberLevel.valueOf(code);
    }

    private MembershipDebugResponse success(String action, String username, String message, Map<String, Object> data) {
        MembershipDebugResponse response = new MembershipDebugResponse();
        response.setOk(true);
        response.setAction(action);
        response.setUsername(username);
        response.setMessage(message);
        response.setData(data);
        return response;
    }
}