package com.cqie.admin.controller;

import com.cqie.admin.common.constant.ExtraPackageConstant;
import com.cqie.admin.common.constant.MemberLevel;
import com.cqie.admin.service.UserMembershipService;
import com.cqie.admin.service.UserPointsAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 仅用于本地联调会员与积分逻辑的测试控制器。
 * 注意：上线前建议删除或加严格权限控制。
 */
@RestController
@RequestMapping("/api/debug/membership")
@RequiredArgsConstructor
public class MembershipDebugController {

    private final UserMembershipService userMembershipService;
    private final UserPointsAccountService userPointsAccountService;

    /**
     * 测试：��接开通 VIP（不接收前端参数）
     */
    @PostMapping("/open-vip")
    public Map<String, Object> openVip() {
        String username = getCurrentUsername();
        userMembershipService.buyMember(username, MemberLevel.VIP.getCode());

        Map<String, Object> result = new HashMap<>();
        result.put("ok", true);
        result.put("username", username);
        result.put("action", "buyMember");
        result.put(username, "VIP");
        return result;
    }

    /**
     * 测试：直接购买加油包（2300）
     */
    @PostMapping("/buy-extra")
    public Map<String, Object> buyExtra() {
        String username = getCurrentUsername();
        userPointsAccountService.addExtraPoints(username, ExtraPackageConstant.POINTS);

        Map<String, Object> result = new HashMap<>();
        result.put("ok", true);
        result.put("username", username);
        result.put("action", "addExtraPoints");
        result.put("points", ExtraPackageConstant.POINTS);
        return result;
    }

    /**
     * 测试：按 std 质量扣 10 秒（250 积分）
     */
    @PostMapping("/consume-std-10s")
    public Map<String, Object> consumeStd10s() {
        String username = getCurrentUsername();
        userPointsAccountService.consumePoints(username, 10, "std");

        Map<String, Object> result = new HashMap<>();
        result.put("ok", true);
        result.put("username", username);
        result.put("action", "consumePoints");
        result.put("seconds", 10);
        result.put("quality", "std");
        result.put("cost", 250);
        return result;
    }

    @PostMapping("/status")
    public Map<String, Object> status() {
        String username = getCurrentUsername();

        // 触发惰性生效（你在 UserMembershipServiceImpl.getCurrentLevel 里已实现）
        MemberLevel currentLevel = userMembershipService.getCurrentLevel(username);

        // 直接查库把 current/next 周期一起返回，便于判断预约是否生效
        com.cqie.admin.entity.UserMembershipDO membership =
                ((com.cqie.admin.service.impl.UserMembershipServiceImpl) userMembershipService)
                        .getBaseMapper()
                        .selectOne(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.cqie.admin.entity.UserMembershipDO>()
                                .eq(com.cqie.admin.entity.UserMembershipDO::getUsername, username)
                                .last("limit 1"));

        Map<String, Object> result = new HashMap<>();
        result.put("ok", true);
        result.put("username", username);
        result.put("today", java.time.LocalDate.now().toString());
        result.put("currentLevel", currentLevel.name());

        if (membership == null) {
            result.put("hasMembership", false);
            return result;
        }

        result.put("hasMembership", true);
        result.put("levelCode", membership.getLevel());
        result.put("currentStart", membership.getCurrentStart());
        result.put("currentEnd", membership.getCurrentEnd());
        result.put("nextLevel", membership.getNextLevel());
        result.put("nextStart", membership.getNextStart());
        result.put("status", membership.getStatus());

        java.time.LocalDate today = java.time.LocalDate.now();
        boolean inCurrentCycle = membership.getCurrentStart() != null
                && membership.getCurrentEnd() != null
                && !today.isBefore(membership.getCurrentStart())
                && !today.isAfter(membership.getCurrentEnd());
        result.put("inCurrentCycle", inCurrentCycle);

        boolean scheduled = membership.getNextLevel() != null && membership.getNextStart() != null;
        result.put("hasSchedule", scheduled);
        result.put("scheduleShouldBeEffectiveToday",
                scheduled && !today.isBefore(membership.getNextStart()));

        return result;
    }


    private String getCurrentUsername() {
        return "test02";
    }
}
