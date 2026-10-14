import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { GlobalLoaderComponent } from './shared/components/global-loader/global-loader.component';

@Component({
  imports: [RouterOutlet, ToastContainerComponent, GlobalLoaderComponent],
  selector: 'app-root',
  template: `
    <app-global-loader />
    <router-outlet />
    <app-toast-container />
  `,
})
export class App {}
