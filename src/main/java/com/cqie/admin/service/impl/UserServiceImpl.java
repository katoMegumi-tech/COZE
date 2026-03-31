package com.cqie.admin.service.impl;



import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cqie.admin.common.exception.ClientException;
import com.cqie.admin.dto.request.UserLoginRequest;
import com.cqie.admin.dto.request.UserRegisterRequest;
import com.cqie.admin.dto.request.UserUpdateRequest;
import com.cqie.admin.dto.response.UserGetUserResponse;
import com.cqie.admin.dto.response.UserUpdateResponse;
import com.cqie.admin.entity.UserDO;
import com.cqie.admin.mapper.UserMapper;
import com.cqie.admin.service.UserService;
import com.cqie.admin.util.BeanUtil;
import com.cqie.admin.util.JwtUtil;
import com.cqie.admin.util.RedisUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RBloomFilter;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import static com.cqie.admin.common.constant.RedisCacheConstant.LOCK_USER_REGISTER;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl extends ServiceImpl<UserMapper, UserDO> implements UserService {

    private final RBloomFilter<String> userRegisterCachePenetrationBloomFilter;
    private final RedissonClient redissonClient;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final RedisUtil redisUtil;

    /**
     * 获取当前登录用户名
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new ClientException("500", "用户未登录");
        }
        return authentication.getName();
    }

    @Override
    public UserGetUserResponse getUserByUsername() {
        String username = getCurrentUsername();
        UserDO userDO = baseMapper.selectOne(
                new LambdaQueryWrapper<UserDO>()
                        .eq(UserDO::getUsername, username)
        );

        if (userDO == null) {
            throw new ClientException("500", "用户不存在");
        }

        return BeanUtil.convert(userDO, new UserGetUserResponse());
    }

    @Override
    public String login(UserLoginRequest requestParam) {

        // 使用authenticationManager进行认证
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                requestParam.getUsername(), requestParam.getPassword());
        Authentication authenticate = authenticationManager.authenticate(authenticationToken);


        if (authenticate == null) {
            throw new ClientException("500", "用户名或密码错误");
        }
        //认证通过
        log.info("用户登录成功:{}", requestParam.getUsername());


        //TODO 需要在返回的jwt中添加权限消息
        SecurityContextHolder.getContext().setAuthentication(authenticate);
        String token = JwtUtil.generateToken(requestParam.getUsername());
        redisUtil.setJti(JwtUtil.extractJti( token), requestParam.getUsername(), 7200L);

        return token;
    }

    /**
     * 检查用户名是否已存在（通过布隆过滤器）
     *
     * @param username 待检查的用户名
     * @return true 表示用户名可能存在（需进一步数据库确认），false 表示用户名一定不存在
     */
    @Override
    public boolean checkUsernameExists(String username) {
        return userRegisterCachePenetrationBloomFilter.contains( username);
    }

    @Override
    public void register(UserRegisterRequest requestParam) {

        //校验用户是否存在
        if (checkUsernameExists(requestParam.getUsername())) {
            throw new ClientException("500", "用户已存在");
        }

        RLock lock = redissonClient.getLock(LOCK_USER_REGISTER + requestParam.getUsername());

        if (!lock.tryLock()) {
            throw new ClientException("500", "用户已存在");
        }

        try {
            requestParam.setPassword(passwordEncoder.encode(requestParam.getPassword()));//加密
            //插入用户
            int insert = baseMapper.insert(BeanUtil.convert(requestParam, UserDO.class));
            if (insert < 1) {
                throw new ClientException("500", "用户保存失败");
            }

            //添加布隆过滤器
            userRegisterCachePenetrationBloomFilter.add(requestParam.getUsername());
        } catch (Exception e) {
            log.error("注册失败，username: {}", requestParam.getUsername(), e);
            throw new ClientException("500", "注册失败");
        } finally {
            lock.unlock();
        }
    }

    @Override
    public void logout() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            String username = authentication.getName();
            redisUtil.deleteJti(username);
            log.info("用户退出登录:{}", username);
        } else {
            throw new ClientException("500", "用户未登录");
        }
        SecurityContextHolder.clearContext();
    }

    /**
     * 更新用户信息
     * @param requestParma 用户更新参数
     * @return 用户更新结果
     */
    @Override
    public UserUpdateResponse updateUser(UserUpdateRequest requestParma) {
        String username = getCurrentUsername();
        UserDO userDO = BeanUtil.convert(requestParma, UserDO.class);
        int update = baseMapper.update(userDO,
                new LambdaUpdateWrapper<UserDO>()
                        .eq(UserDO::getUsername, username)
        );

        if (update < 1) {
            throw new ClientException("500", "用户更新失败");
        }

        log.info("用户更新成功:{}", username);
        return BeanUtil.convert(userDO, UserUpdateResponse.class);
    }
}
