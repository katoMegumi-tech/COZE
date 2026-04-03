package com.cqie.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.cqie.admin.entity.PaymentOrderDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

/**
 * 支付订单Mapper
 */
@Mapper
public interface PaymentOrderMapper extends BaseMapper<PaymentOrderDO> {

    /**
     * 根据订单号查询订单
     */
    @Select("SELECT * FROM payment_order WHERE order_no = #{orderNo} AND deleted = 0")
    PaymentOrderDO selectByOrderNo(@Param("orderNo") String orderNo);

    /**
     * 更新订单状态
     */
    @Update("UPDATE payment_order SET status = #{status}, transaction_id = #{transactionId}, " +
            "pay_time = #{payTime}, notify_result = #{notifyResult}, update_time = NOW() " +
            "WHERE order_no = #{orderNo} AND deleted = 0")
    int updateOrderStatus(@Param("orderNo") String orderNo,
                          @Param("status") Integer status,
                          @Param("transactionId") String transactionId,
                          @Param("payTime") java.util.Date payTime,
                          @Param("notifyResult") String notifyResult);
}
