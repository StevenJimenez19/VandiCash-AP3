import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular/lazy';
import { PerfilPageRoutingModule } from './perfil-routing.module';
import { PerfilPage } from './perfil.page';

@NgModule({
  imports: [CommonModule, IonicModule, PerfilPageRoutingModule],
  declarations: [PerfilPage],
})
export class PerfilPageModule {}
