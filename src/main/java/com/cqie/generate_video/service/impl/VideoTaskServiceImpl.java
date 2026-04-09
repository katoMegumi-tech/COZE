package com.cqie.generate_video.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cqie.generate_video.entity.VideoTaskDO;
import com.cqie.generate_video.mapper.VideoTaskMapper;
import com.cqie.generate_video.service.VideoTaskService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.Date;


@Service
public class VideoTaskServiceImpl extends ServiceImpl<VideoTaskMapper, VideoTaskDO>
        implements VideoTaskService {

    @Override
    public IPage<VideoTaskDO> getVideoTaskList(long current, long size) {
        IPage<VideoTaskDO> page = new Page<>(current, size);
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        //删除三天之前创建的任务，执行逻辑删除
        Date date = new Date(System.currentTimeMillis() - 3 * 24 * 60 * 60 * 1000);
        baseMapper.delete(
                new LambdaQueryWrapper<VideoTaskDO>()
                        .eq(VideoTaskDO::getUsername, username)
                        .lt(VideoTaskDO::getCreateTime, date)
        );

        // 查询当前用户的任务
        LambdaQueryWrapper<VideoTaskDO> queryWrapper = new LambdaQueryWrapper<VideoTaskDO>()
                .eq(VideoTaskDO::getUsername, username) // 只查询当前用户的任务
                .orderByDesc(VideoTaskDO::getCreateTime); // 按创建时间降序排序

        return this.page(page, queryWrapper);
    }
}