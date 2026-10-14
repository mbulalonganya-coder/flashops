package com.flashops.api.admin;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
public class RequestContext {

  public String clientIp() {
    HttpServletRequest req = currentRequest();
    if (req == null) {
      return null;
    }
    String forwarded = req.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      return forwarded.split(",")[0].trim();
    }
    return req.getRemoteAddr();
  }

  public String userAgent() {
    HttpServletRequest req = currentRequest();
    if (req == null) {
      return null;
    }
    String ua = req.getHeader("User-Agent");
    return ua == null ? null : ua.substring(0, Math.min(ua.length(), 500));
  }

  private static HttpServletRequest currentRequest() {
    var attrs = RequestContextHolder.getRequestAttributes();
    if (attrs instanceof ServletRequestAttributes servlet) {
      return servlet.getRequest();
    }
    return null;
  }
}
