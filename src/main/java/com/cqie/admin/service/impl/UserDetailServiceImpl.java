package com.cqie.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.cqie.admin.common.exception.ClientException;
import com.cqie.admin.entity.PermissionDO;
import com.cqie.admin.entity.RoleDO;
import com.cqie.admin.entity.RolePermissionDO;
import com.cqie.admin.entity.UserDO;
import com.cqie.admin.entity.UserRoleDO;
import com.cqie.admin.mapper.PermissionMapper;
import com.cqie.admin.mapper.RoleMapper;
import com.cqie.admin.mapper.RolePermissionMapper;
import com.cqie.admin.mapper.UserMapper;
import com.cqie.admin.mapper.UserRoleMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;


@Service
@Slf4j
@RequiredArgsConstructor
public class UserDetailServiceImpl implements UserDetailsService{

    private final UserMapper userMapper;
    private final UserRoleMapper userRoleMapper;
    private final RoleMapper roleMapper;
    private final RolePermissionMapper rolePermissionMapper;
    private final PermissionMapper permissionMapper;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        if (username == null || username.trim().isEmpty()) {
            throw new UsernameNotFoundException("用户名不能为空");
        }

        // 查询用户
        UserDO userDO = userMapper.selectOne(new LambdaQueryWrapper<UserDO>()
                .eq(UserDO::getUsername, username)
                .eq(UserDO::getDeleted, 0)
        );

        if (userDO == null) {
            throw new UsernameNotFoundException("用户不存在");
        }

        // 查询用户的角色关联
        List<UserRoleDO> userRoleList = userRoleMapper.selectList(new LambdaQueryWrapper<UserRoleDO>()
                .eq(UserRoleDO::getUserId, userDO.getId())
        );

        List<Long> roleIds = userRoleList == null ? new ArrayList<>() : userRoleList.stream()
                .map(UserRoleDO::getRoleId)
                .distinct()
                .collect(Collectors.toList());

        // 查询角色信息
        List<RoleDO> roles = roleIds.isEmpty() ? new ArrayList<>() : roleMapper.selectBatchIds(roleIds);

        // 构建 GrantedAuthority 列表，包含 ROLE_ 前缀的角色和 permission.code
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        // 添加角色作为 ROLE_xxx
        if (roles != null) {
            for (RoleDO r : roles) {
                if (r != null && r.getCode() != null) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + r.getCode()));
                }
            }
        }

        // 查询角色权限关联以获取 permission ids
        List<RolePermissionDO> rolePermList = roleIds.isEmpty() ? new ArrayList<>() : rolePermissionMapper.selectList(
                new LambdaQueryWrapper<RolePermissionDO>().in(RolePermissionDO::getRoleId, roleIds)
        );

        Set<Long> permIds = rolePermList == null ? Set.of() : rolePermList.stream()
                .map(RolePermissionDO::getPermissionId)
                .collect(Collectors.toSet());

        // 查询权限详情并添加为 authority（使用 permission.code）
        if (!permIds.isEmpty()) {
            List<PermissionDO> perms = permissionMapper.selectBatchIds(new ArrayList<>(permIds));
            if (perms != null) {
                for (PermissionDO p : perms) {
                    if (p != null && p.getCode() != null && Integer.valueOf(1).equals(p.getStatus())) {
                        authorities.add(new SimpleGrantedAuthority(p.getCode()));
                    }
                }
            }
        }

        // 返回用户信息，设置 disabled 状态（status==0 表示禁用）
        boolean disabled = userDO.getStatus() != null && userDO.getStatus() == 0;

        return User.builder()
                .username(userDO.getUsername())
                .password(userDO.getPassword())
                .authorities(authorities)
                .disabled(disabled)
                .build();
    }
}
