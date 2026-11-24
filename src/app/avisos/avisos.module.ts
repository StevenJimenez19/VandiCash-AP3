import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular/lazy';
import { AvisosPageRoutingModule } from './avisos-routing.module';
import { AvisosPage } from './avisos.page';

@NgModule({
  imports: [CommonModule, IonicModule, AvisosPageRoutingModule],
  declarations: [AvisosPage],
})
export class AvisosPageModule {}
