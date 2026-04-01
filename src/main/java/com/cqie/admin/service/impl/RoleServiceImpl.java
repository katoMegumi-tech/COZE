package com.cqie.admin.service.impl;


import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cqie.admin.entity.RoleDO;
import com.cqie.admin.mapper.RoleMapper;
import com.cqie.admin.service.RoleService;
import org.springframework.stereotype.Service;

@Service
public class RoleServiceImpl extends ServiceImpl<RoleMapper, RoleDO> implements RoleService {
}
