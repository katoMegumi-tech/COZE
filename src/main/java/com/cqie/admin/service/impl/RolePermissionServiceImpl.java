package com.cqie.admin.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;

import com.cqie.admin.entity.RolePermissionDO;
import com.cqie.admin.mapper.RolePermissionMapper;
import com.cqie.admin.service.RolePermissionService;
import org.springframework.stereotype.Service;

@Service
public class RolePermissionServiceImpl extends ServiceImpl<RolePermissionMapper, RolePermissionDO> implements RolePermissionService {
}
