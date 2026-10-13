package com.flashops.api.web;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/config")
public class PublicConfigController {

  @GetMapping("/public")
  public Map<String, Object> publicConfig() {
    return Map.of(
        "data",
        Map.of(
            "app_name", "Flash OPS",
            "app_short_name", "Flash",
            "app_url", "http://localhost:4200",
            "logo_light", "",
            "logo_dark", "",
            "favicon", "",
            "default_language", "fr"));
  }
}
