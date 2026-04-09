package com.cqie.generate_video.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cqie.generate_video.entity.VideoTaskDO;
import com.cqie.generate_video.mapper.VideoTaskMapper;
import com.cqie.generate_video.service.VideoTaskService;
import org.springframework.stereotype.Service;

@Service
public class VideoTaskServiceImpl extends ServiceImpl<VideoTaskMapper, VideoTaskDO>
        implements VideoTaskService {

}