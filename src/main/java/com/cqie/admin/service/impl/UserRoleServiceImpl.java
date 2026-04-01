package com.cqie.admin.service.impl;


import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cqie.admin.entity.UserRoleDO;
import com.cqie.admin.mapper.UserRoleMapper;
import com.cqie.admin.service.UserRoleService;
import org.springframework.stereotype.Service;

@Service
public class UserRoleServiceImpl extends ServiceImpl<UserRoleMapper, UserRoleDO> implements UserRoleService {
}
