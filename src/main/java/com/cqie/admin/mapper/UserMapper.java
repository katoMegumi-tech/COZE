package com.cqie.admin.mapper;


import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.cqie.admin.entity.UserDO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<UserDO> {

}