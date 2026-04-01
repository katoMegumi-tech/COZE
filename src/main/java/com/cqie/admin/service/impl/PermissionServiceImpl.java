package com.cqie.admin.service.impl;


import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;

import com.cqie.admin.entity.PermissionDO;
import com.cqie.admin.mapper.PermissionMapper;
import com.cqie.admin.service.PermissionService;
import org.springframework.stereotype.Service;

@Service
public class PermissionServiceImpl extends ServiceImpl<PermissionMapper, PermissionDO> implements PermissionService {
}
