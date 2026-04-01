package com.cqie.generate_video.result;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.io.Serializable;

@Schema(description = "统一响应结果")
@Data
public class Result<T> implements Serializable {
    
    @Schema(description = "状态码", example = "200")
    private Integer code;
    
    @Schema(description = "响应消息", example = "success")
    private String message;
    
    @Schema(description = "响应数据")
    private T data;
    
    public Result() {
        this.code = 200;
        this.message = "success";
    }
    
    public Result(Integer code, String message) {
        this.code = code;
        this.message = message;
    }
    
    public Result(T data) {
        this.code = 200;
        this.message = "success";
        this.data = data;
    }
    
    public static <T> Result<T> success() {
        return new Result<>();
    }
    
    public static <T> Result<T> success(T data) {
        return new Result<>(data);
    }
    
    public static <T> Result<T> error(String message) {
        return new Result<>(500, message);
    }
    
    public static <T> Result<T> error(Integer code, String message) {
        return new Result<>(code, message);
    }
}
