import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  AccessToken,
  AccessTokenCreateResult,
  AccessTokenInput,
  AdminRole,
  AdminUserInput,
  AppSettings,
  Permission,
  ScheduledReport,
  ScheduledReportInput,
  ReportRecipient,
  DocumentShareInput,
  PagedUserActions,
  ReportShareInput,
  ReportShareResult,
  User,
  UserActionDetail,
} from '../models/api.models';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly runtime = inject(RuntimeConfigService);

  private get baseUrl(): string {
    return `${this.runtime.apiUrl}/auth`;
  }

  listUsers() {
    return this.http.get<{ data: User[] }>(`${this.baseUrl}/users`);
  }

  createUser(input: AdminUserInput) {
    return this.http.post<{ data: User }>(`${this.baseUrl}/users`, input);
  }

  updateUser(id: number, input: AdminUserInput) {
    return this.http.put<{ data: User }>(`${this.baseUrl}/users/${id}`, input);
  }

  setUserPermissions(id: number, permissionIds: number[]) {
    return this.http.put<{ data: User }>(`${this.baseUrl}/users/${id}/permissions`, {
      permission_ids: permissionIds,
    });
  }

  listRoles() {
    return this.http.get<{ data: AdminRole[] }>(`${this.baseUrl}/roles`);
  }

  listPermissions() {
    return this.http.get<{ data: Permission[] }>(`${this.baseUrl}/permissions`);
  }

  setRolePermissions(id: number, permissionIds: number[]) {
    return this.http.put<{ data: AdminRole }>(`${this.baseUrl}/roles/${id}/permissions`, {
      permission_ids: permissionIds,
    });
  }

  getSettings() {
    return this.http.get<{ data: AppSettings }>(`${this.baseUrl}/settings`);
  }

  updateSettings(settings: AppSettings) {
    return this.http.put<{ data: AppSettings }>(`${this.baseUrl}/settings`, settings);
  }

  testSmtp(to?: string) {
    return this.http.post<{ data: { to: string; status: string } }>(`${this.baseUrl}/settings/smtp/test`, {
      to: to ?? '',
    });
  }

  listSchedules() {
    return this.http.get<{ data: ScheduledReport[] }>(`${this.baseUrl}/schedules`);
  }

  createSchedule(input: ScheduledReportInput) {
    return this.http.post<{ data: ScheduledReport }>(`${this.baseUrl}/schedules`, input);
  }

  updateSchedule(id: number, input: ScheduledReportInput) {
    return this.http.put<{ data: ScheduledReport }>(`${this.baseUrl}/schedules/${id}`, input);
  }

  deleteSchedule(id: number) {
    return this.http.delete<{ data: { status: string } }>(`${this.baseUrl}/schedules/${id}`);
  }

  sendScheduleNow(id: number) {
    return this.http.post<{ data: ScheduledReport }>(`${this.baseUrl}/schedules/${id}/send`, {});
  }

  listReportRecipients() {
    return this.http.get<{ data: ReportRecipient[] }>(`${this.baseUrl}/report-recipients`);
  }

  shareReport(input: ReportShareInput) {
    return this.http.post<{ data: ReportShareResult }>(`${this.baseUrl}/reports/share`, input);
  }

  listAccessTokens() {
    return this.http.get<{ data: AccessToken[] }>(`${this.baseUrl}/access-tokens`);
  }

  createAccessToken(input: AccessTokenInput) {
    return this.http.post<{ data: AccessTokenCreateResult }>(`${this.baseUrl}/access-tokens`, input);
  }

  updateAccessToken(id: number, input: AccessTokenInput) {
    return this.http.put<{ data: AccessToken }>(`${this.baseUrl}/access-tokens/${id}`, input);
  }

  deleteAccessToken(id: number) {
    return this.http.delete<{ status: string }>(`${this.baseUrl}/access-tokens/${id}`);
  }

  listActions(page = 0, pageSize = 25) {
    return this.http.get<{ data: PagedUserActions }>(`${this.baseUrl}/actions`, {
      params: { page: String(page), page_size: String(pageSize) },
    });
  }

  getAction(id: number) {
    return this.http.get<{ data: UserActionDetail }>(`${this.baseUrl}/actions/${id}`);
  }

  shareDocument(input: DocumentShareInput) {
    const body: ReportShareInput = {
      report_type: 'document',
      cc_all_users: input.cc_all_users,
      message: input.message,
      subject: input.subject,
      attachments: input.attachments,
    };
    if (input.to_user_id != null) {
      body.to_user_id = input.to_user_id;
    }
    return this.http.post<{ data: ReportShareResult }>(`${this.baseUrl}/reports/share`, body);
  }
}
