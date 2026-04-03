package com.cqie.admin.util;

import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

/**
 * 微信支付工具类
 */
public class WechatPayUtil {

    /**
     * 生成随机字符串
     */
    public static String generateNonceStr() {
        return UUID.randomUUID().toString().replaceAll("-", "").substring(0, 32);
    }

    /**
     * 生成时间戳
     */
    public static String generateTimestamp() {
        return String.valueOf(System.currentTimeMillis() / 1000);
    }

    /**
     * 生成MD5签名
     */
    public static String generateMD5Sign(Map<String, String> params, String apiKey) {
        String signStr = createSignString(params);
        signStr += "&key=" + apiKey;
        return md5(signStr).toUpperCase();
    }

    /**
     * 验证MD5签名
     */
    public static boolean verifyMD5Sign(Map<String, String> params, String apiKey, String sign) {
        String calculatedSign = generateMD5Sign(params, apiKey);
        return calculatedSign.equals(sign);
    }

    /**
     * 生成支付参数签名（用于前端调起支付）
     */
    public static String generatePaySign(String appId, String timeStamp, String nonceStr, String packageStr, String signType, String apiKey) {
        Map<String, String> params = new TreeMap<>();
        params.put("appId", appId);
        params.put("timeStamp", timeStamp);
        params.put("nonceStr", nonceStr);
        params.put("package", packageStr);
        params.put("signType", signType);
        return generateMD5Sign(params, apiKey);
    }

    /**
     * 构建签名字符串
     */
    private static String createSignString(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        // 使用TreeMap按键排序
        TreeMap<String, String> sortedParams = new TreeMap<>(params);
        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            // 排除空值和sign字段
            if (StringUtils.hasText(value) && !"sign".equals(key)) {
                sb.append(key).append("=").append(value).append("&");
            }
        }
        // 移除最后一个&
        if (sb.length() > 0) {
            sb.deleteCharAt(sb.length() - 1);
        }
        return sb.toString();
    }

    /**
     * MD5加密
     */
    private static String md5(String str) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] bytes = md.digest(str.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                String hex = Integer.toHexString(b & 0xFF);
                if (hex.length() == 1) {
                    sb.append("0");
                }
                sb.append(hex);
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("MD5加密失败", e);
        }
    }

    /**
     * Map转换为XML
     */
    public static String mapToXml(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        sb.append("<xml>");
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (StringUtils.hasText(value)) {
                sb.append("<").append(key).append(">");
                sb.append("<![CDATA[").append(value).append("]]>");
                sb.append("</").append(key).append(">");
            }
        }
        sb.append("</xml>");
        return sb.toString();
    }

    /**
     * XML转换为Map
     */
    public static Map<String, String> xmlToMap(String xml) {
        Map<String, String> map = new HashMap<>();
        try {
            javax.xml.parsers.DocumentBuilderFactory factory = javax.xml.parsers.DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            javax.xml.parsers.DocumentBuilder builder = factory.newDocumentBuilder();
            org.w3c.dom.Document document = builder.parse(new java.io.ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
            org.w3c.dom.Element element = document.getDocumentElement();
            org.w3c.dom.NodeList nodeList = element.getChildNodes();
            for (int i = 0; i < nodeList.getLength(); i++) {
                org.w3c.dom.Node node = nodeList.item(i);
                if (node.getNodeType() == org.w3c.dom.Node.ELEMENT_NODE) {
                    map.put(node.getNodeName(), node.getTextContent());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("XML解析失败", e);
        }
        return map;
    }

    /**
     * 生成商户订单号
     */
    public static String generateOrderNo() {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String random = String.valueOf((int) ((Math.random() * 9 + 1) * 1000));
        return "PAY" + timestamp + random;
    }
}
