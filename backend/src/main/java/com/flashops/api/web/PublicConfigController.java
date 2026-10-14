package com.flashops.api.web;

import com.flashops.api.admin.AppParametersService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/config")
public class PublicConfigController {

  private final AppParametersService appParameters;

  public PublicConfigController(AppParametersService appParameters) {
    this.appParameters = appParameters;
  }

  @GetMapping("/public")
  public Map<String, Object> publicConfig() {
    return appParameters.publicConfig();
  }
}
