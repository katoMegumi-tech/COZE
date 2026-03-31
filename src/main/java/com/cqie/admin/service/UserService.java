package com.cqie.admin.service;



import com.baomidou.mybatisplus.extension.service.IService;
import com.cqie.admin.dto.request.UserLoginRequest;
import com.cqie.admin.dto.request.UserRegisterRequest;
import com.cqie.admin.dto.request.UserUpdateRequest;
import com.cqie.admin.dto.response.UserGetUserResponse;
import com.cqie.admin.dto.response.UserUpdateResponse;
import com.cqie.admin.entity.UserDO;

public interface UserService extends IService<UserDO> {

    // 获取用户信息
    UserGetUserResponse getUserByUsername();

    // 用户登录
    String login(UserLoginRequest requestParam);

    // 用户注册
    void register(UserRegisterRequest requestParam);

    // 检查用户名是否已存在
    boolean checkUsernameExists(String username);

    // 用户登出
    void logout();

    // 更新用户信息
    UserUpdateResponse updateUser(UserUpdateRequest requestParma);


}