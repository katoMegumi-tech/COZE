package com.cqie.admin.service.impl;



import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cqie.admin.common.exception.ClientException;
import com.cqie.admin.common.config.WechatProperties;
import com.cqie.admin.dto.request.UserLoginRequest;
import com.cqie.admin.dto.request.UserRegisterRequest;
import com.cqie.admin.dto.request.UserUpdateRequest;
import com.cqie.admin.dto.request.WechatLoginRequest;
import com.cqie.admin.dto.response.UserGetUserResponse;
import com.cqie.admin.dto.response.UserLoginResponse;
import com.cqie.admin.dto.response.UserUpdateResponse;
import com.cqie.admin.dto.response.WechatLoginResponse;
import com.cqie.admin.dto.response.WechatSessionResponse;
import com.cqie.admin.entity.UserDO;
import com.cqie.admin.entity.UserRoleDO;
import com.cqie.admin.mapper.UserMapper;
import com.cqie.admin.service.UserPointsLogService;
import com.cqie.admin.service.UserRoleService;
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
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Random;
import java.util.UUID;

import static com.cqie.admin.common.constant.RedisCacheConstant.LOCK_USER_REGISTER;
import static com.cqie.admin.common.constant.UserRegisterConstant.DEFAULT_POINTS;
import static com.cqie.admin.common.constant.UserRegisterConstant.DEFAULT_ROLE;
import static com.cqie.generate_video.constant.PointsConsumeEnum.NEW_USER_REGISTER;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl extends ServiceImpl<UserMapper, UserDO> implements UserService {

    private final RBloomFilter<String> userRegisterCachePenetrationBloomFilter;
    private final RedissonClient redissonClient;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final RedisUtil redisUtil;
    private final UserRoleService userRoleService;
    private final UserPointsLogService userPointsLogService;
    private final WechatProperties wechatProperties;
    private final RestTemplate restTemplate;

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

        return BeanUtil.convert(userDO, UserGetUserResponse.class);
    }

    @Override
    public UserLoginResponse login(UserLoginRequest requestParam) {

        // 使用authenticationManager进行认证
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                requestParam.getUsername(), requestParam.getPassword());
        Authentication authenticate = authenticationManager.authenticate(authenticationToken);


        if (authenticate == null) {
            throw new ClientException("500", "用户名或密码错误");
        }
        //认证通过
        log.info("用户登录成功:{}", requestParam.getUsername());

        UserDO userDO = baseMapper.selectOne(new LambdaQueryWrapper<UserDO>()
                .eq(UserDO::getUsername, requestParam.getUsername())
        );

        // 将认证信息存入SecurityContext，并在redis中存储登录态
        SecurityContextHolder.getContext().setAuthentication(authenticate);
        String token = JwtUtil.generateToken(requestParam.getUsername());
        redisUtil.setJti(JwtUtil.extractJti( token), requestParam.getUsername(), 7200L);

        //构建登录响应对象
        UserLoginResponse convert = BeanUtil.convert(userDO, UserLoginResponse.class);
        convert.setToken(token);

        return convert;
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

    /**
     * 用户注册
     * @param requestParam 注册参数
     */

    @Transactional(rollbackFor = Exception.class)
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

            //检查昵称是否是空，如果是空则生成一个随机昵称
            String nickname = requestParam.getNickname();
            if (nickname == null || nickname.trim().isEmpty()) {
                requestParam.setNickname(generateNickname());
            }

            //插入用户
            UserDO userDO = BeanUtil.convert(requestParam, UserDO.class);
                        
            // 确保用户名不为空
            if (requestParam.getUsername() == null || requestParam.getUsername().trim().isEmpty()) {
                throw new ClientException("500", "用户名不能为空");
            }

            int insert = baseMapper.insert(userDO);
            Long id = userDO.getId();
                        
            if (insert < 1) {
                throw new ClientException("500", "用户保存失败");
            }
            
            //写入积分变动表（必须在用户保存之后）
            userPointsLogService.updateUserPoints(
                    requestParam.getUsername(),
                    NEW_USER_REGISTER.getPoints(),
                    NEW_USER_REGISTER.getDesc()
            );
            
            //给用户配置默认角色
            userRoleService.save(
                    UserRoleDO.builder()
                            .userId(id)
                            .roleId(DEFAULT_ROLE) //默认角色 id
                            .build()
            );
            
            //添加布隆过滤器
            userRegisterCachePenetrationBloomFilter.add(requestParam.getUsername());
        } catch (ClientException e) {
            // 业务异常直接抛出，保留原始错误信息
            throw e;
        } catch (Exception e) {
            log.error("注册失败，username: {}", requestParam.getUsername(), e);
            throw new ClientException("500", "注册失败");
        } finally {
            lock.unlock();
        }
    }

    /**
     * 生成随机昵称
     * @return 随机昵称
     */
    public String generateNickname() {
        return "用户" + (10000 + new Random().nextInt(90000));
    }

    /**
     * 用户退出登录
     */
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

    /**
     * 微信小程序登录
     * @param requestParam 微信登录请求参数
     * @return 登录响应
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public WechatLoginResponse wechatLogin(WechatLoginRequest requestParam) {
        String code = requestParam.getCode();
        if (code == null || code.trim().isEmpty()) {
            throw new ClientException("400", "微信登录凭证不能为空");
        }

        // 1. 调用微信接口换取openid和session_key
        String url = String.format(
                "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
                wechatProperties.getAppid(),
                wechatProperties.getSecret(),
                code
        );

        WechatSessionResponse sessionResponse;
        try {
            sessionResponse = restTemplate.getForObject(url, WechatSessionResponse.class);
        } catch (Exception e) {
            log.error("调用微信接口失败", e);
            throw new ClientException("500", "微信登录服务异常");
        }

        if (sessionResponse == null) {
            throw new ClientException("500", "微信登录服务无响应");
        }

        if (sessionResponse.getErrcode() != null && sessionResponse.getErrcode() != 0) {
            log.error("微信登录失败，errcode: {}, errmsg: {}", sessionResponse.getErrcode(), sessionResponse.getErrmsg());
            throw new ClientException("500", "微信登录失败: " + sessionResponse.getErrmsg());
        }

        String openid = sessionResponse.getOpenid();
        if (openid == null || openid.trim().isEmpty()) {
            throw new ClientException("500", "获取微信用户信息失败");
        }

        log.info("微信用户登录，openid: {}", openid);

        // 2. 根据openid查询用户
        UserDO userDO = baseMapper.selectOne(
                new LambdaQueryWrapper<UserDO>()
                        .eq(UserDO::getOpenid, openid)
        );

        // 3. 用户不存在则创建新用户
        if (userDO == null) {
            log.info("微信用户首次登录，创建新用户，openid: {}", openid);
            userDO = createWechatUser(openid);
        }

        // 4. 生成JWT token
        String token = JwtUtil.generateToken(userDO.getUsername());
        redisUtil.setJti(JwtUtil.extractJti(token), userDO.getUsername(), 7200L);

        log.info("微信用户登录成功，username: {}", userDO.getUsername());

        // 5. 构建响应
        return WechatLoginResponse.builder()
                .username(userDO.getUsername())
                .nickname(userDO.getNickname())
                .phone(userDO.getPhone())
                .email(userDO.getEmail())
                .points(userDO.getPoints())
                .token(token)
                .build();
    }

    /**
     * 创建微信用户
     * @param openid 微信openid
     * @return 创建的用户
     */
    private UserDO createWechatUser(String openid) {
        // 生成随机用户名
        String username = "wx_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String nickname = generateNickname();

        UserDO userDO = new UserDO();
        userDO.setUsername(username);
        userDO.setPassword(passwordEncoder.encode(UUID.randomUUID().toString())); // 随机密码
        userDO.setNickname(nickname);
        userDO.setOpenid(openid);
        userDO.setPoints(DEFAULT_POINTS);
        userDO.setStatus(1);

        // 保存用户
        int insert = baseMapper.insert(userDO);
        if (insert < 1) {
            throw new ClientException("500", "创建用户失败");
        }

        Long userId = userDO.getId();

        // 配置默认角色
        userRoleService.save(
                UserRoleDO.builder()
                        .userId(userId)
                        .roleId(DEFAULT_ROLE)
                        .build()
        );

        // 添加布隆过滤器
        userRegisterCachePenetrationBloomFilter.add(username);

        // 记录积分变动
        userPointsLogService.updateUserPoints(
                username,
                NEW_USER_REGISTER.getPoints(),
                NEW_USER_REGISTER.getDesc()
        );

        log.info("微信用户创建成功，username: {}, openid: {}", username, openid);
        return userDO;
    }
}
