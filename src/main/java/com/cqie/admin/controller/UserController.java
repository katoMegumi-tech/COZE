package com.cqie.admin.controller;


import com.cqie.admin.dto.request.UserLoginRequest;
import com.cqie.admin.dto.request.UserRegisterRequest;
import com.cqie.admin.dto.request.UserUpdateRequest;
import com.cqie.admin.dto.response.UserUpdateResponse;
import com.cqie.admin.service.UserService;
import com.cqie.generate_video.result.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/user")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * 用户登录
     * @param requestParam 用户登录参数
     * @return  token
     */
    @PostMapping("/login")
    public Result<String> login(@RequestBody UserLoginRequest requestParam) {
        return Result.success(userService.login(requestParam));
    }

    /**
     * 根据用户名获取用户信息
     * @return 用户信息
     */
    @PostMapping("/getUserByUsername")
    public Result<Object> getUserByUsername() {
        return Result.success(userService.getUserByUsername());
    }

    /**
     * 用户注册
     * @param requestParam 用户注册参数
     * @return 注册结果
     */
    @PostMapping("/register")
    public Result<Void> register(@RequestBody UserRegisterRequest requestParam) {
        userService.register(requestParam);
        return Result.success();
    }

    /**
     * 用户登出
     * @return 登出结果
     */
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
    @PostMapping("/checkUsernameExists")
    public Result<Boolean> checkUsernameExists(@RequestBody String username) {
        return Result.success(userService.checkUsernameExists(username));
    }

    /**
     * 修改用户信息
     * @param requestParam 修改用户信息参数
     * @return 修改结果
     */
    @PostMapping("/updateUser")
    public Result<UserUpdateResponse> updateUser(@RequestBody UserUpdateRequest requestParam) {
        return Result.success(userService.updateUser(requestParam));
    }


}
