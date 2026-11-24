import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AvisosPage } from './avisos.page';

const routes: Routes = [{ path: '', component: AvisosPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AvisosPageRoutingModule {}
