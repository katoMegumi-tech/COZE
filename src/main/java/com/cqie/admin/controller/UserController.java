package com.cqie.admin.controller;


import com.cqie.admin.dto.request.UserLoginRequest;
import com.cqie.admin.dto.request.UserRegisterRequest;
import com.cqie.admin.dto.request.UserUpdateRequest;
import com.cqie.admin.dto.response.UserLoginResponse;
import com.cqie.admin.dto.response.UserUpdateResponse;
import com.cqie.admin.service.UserService;
import com.cqie.generate_video.result.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/admin/user")
@Tag(name = "用户管理", description = "用户登录、注册、信息管理等接口")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * 用户登录
     * @param requestParam 用户登录参数
     * @return  token
     */
    @Operation(summary = "用户登录", description = "用户名密码登录，返回 JWT Token")
    @PostMapping("/login")
    public Result<UserLoginResponse> login(@RequestBody UserLoginRequest requestParam) {
        return Result.success(userService.login(requestParam));
    }

    /**
     * 根据用户名获取用户信息
     * @return 用户信息
     */
    @Operation(summary = "获取当前用户信息", description = "获取当前登录用户的详细信息")
    @PreAuthorize("hasAuthority('user:getInfo')")
    @PostMapping("/getUserByUsername")
    public Result<Object> getUserByUsername() {
        return Result.success(userService.getUserByUsername());
    }

    /**
     * 用户注册
     * @param requestParam 用户注册参数
     * @return 注册结果
     */
    @Operation(summary = "用户注册", description = "新用户注册账号")
    @PostMapping("/register")
    public Result<Void> register(@RequestBody UserRegisterRequest requestParam) {
        userService.register(requestParam);
        return Result.success();
    }

    /**
     * 用户登出
     * @return 登出结果
     */
    @Operation(summary = "用户登出", description = "退出登录")
    @PreAuthorize("hasAuthority('user:logout')")
    @PostMapping("/logout")
    public Result<Void> logout() {
        userService.logout();
        return Result.success();
    }

    /**
     * 检查用户名是否存在
     * @param username 用户名
     * @return 是否存在
     */
    @Operation(summary = "检查用户名是否存在", description = "验证用户名是否已被注册")
    @PostMapping("/checkUsernameExists")
    public Result<Boolean> checkUsernameExists(@RequestBody String username) {
        return Result.success(userService.checkUsernameExists(username));
    }

    /**
     * 修改用户信息
     * @param requestParam 修改用户信息参数
     * @return 修改结果
     */
    @Operation(summary = "修改用户信息", description = "更新当前登录用户的信息")
    @PreAuthorize("hasAuthority('user:update')")
    @PostMapping("/updateUser")
    public Result<UserUpdateResponse> updateUser(@RequestBody UserUpdateRequest requestParam) {
        return Result.success(userService.updateUser(requestParam));
    }


}
