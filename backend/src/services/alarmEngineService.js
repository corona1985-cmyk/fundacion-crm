const { Alarma, Becario, Persona, MateriaCursada, Materia, Documento, Pago, Padrino, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Automated Business Rule Evaluation & Alarm Engine
 */
class AlarmEngineService {
  /**
   * Run full evaluation sweep across all business rules
   */
  static async evaluateAll() {
    const results = {
      promedioBajo: await this.evaluatePromedioBajo(),
      materiasReprobadas: await this.evaluateMateriasReprobadas(),
      documentosVencidos: await this.evaluateDocumentosVencidos(),
      pagosVencidos: await this.evaluatePagosVencidos()
    };
    return results;
  }

  /**
   * Rule 1: GPA < 2.50 -> Critical Alarm
   */
  static async evaluatePromedioBajo() {
    const becariosBajo = await Becario.findAll({
      where: {
        promedio_general: { [Op.lt]: 2.50 },
        estado_beca: 'activa'
      },
      include: [{ model: Persona, as: 'persona' }]
    });

    let count = 0;
    for (const becario of becariosBajo) {
      const existing = await Alarma.findOne({
        where: {
          tipo: 'PROMEDIO_BAJO',
          entidad_relacionada: 'Becario',
          entidad_id: becario.id,
          estado: 'pendiente'
        }
      });

      if (!existing) {
        const nombreCompleto = becario.persona ? `${becario.persona.nombre} ${becario.persona.apellido}` : `Becario #${becario.id}`;
        await Alarma.create({
          tipo: 'PROMEDIO_BAJO',
          nivel: 'critico',
          titulo: `Promedio Crítico: ${nombreCompleto}`,
          descripcion: `El becario ${nombreCompleto} presenta un índice acumulado de ${parseFloat(becario.promedio_general).toFixed(2)} (por debajo del mínimo requerido de 2.50).`,
          entidad_relacionada: 'Becario',
          entidad_id: becario.id,
          estado: 'pendiente'
        });
        count++;
      }
    }
    return count;
  }

  /**
   * Rule 2: Failed Subjects (REPROBADA) -> Medium Alarm
   */
  static async evaluateMateriasReprobadas() {
    const reprobadas = await MateriaCursada.findAll({
      where: { estado: 'REPROBADA' },
      include: [
        { model: Becario, as: 'becario', include: [{ model: Persona, as: 'persona' }] },
        { model: Materia, as: 'materia' }
      ]
    });

    let count = 0;
    for (const item of reprobadas) {
      const existing = await Alarma.findOne({
        where: {
          tipo: 'MATERIA_REPROBADA',
          entidad_relacionada: 'MateriaCursada',
          entidad_id: item.id,
          estado: 'pendiente'
        }
      });

      if (!existing) {
        const nombreCompleto = item.becario?.persona ? `${item.becario.persona.nombre} ${item.becario.persona.apellido}` : `Becario #${item.becario_id}`;
        const nombreMateria = item.materia ? item.materia.nombre : `Materia #${item.materia_id}`;

        await Alarma.create({
          tipo: 'MATERIA_REPROBADA',
          nivel: 'medio',
          titulo: `Materia Reprobada: ${nombreCompleto}`,
          descripcion: `El becario ${nombreCompleto} reprobó la asignatura ${nombreMateria}.`,
          entidad_relacionada: 'MateriaCursada',
          entidad_id: item.id,
          estado: 'pendiente'
        });
        count++;
      }
    }
    return count;
  }

  /**
   * Rule 3: Documents expiring in <= 15 days or already expired -> Medium Alarm
   */
  static async evaluateDocumentosVencidos() {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 15);

    const documentos = await Documento.findAll({
      where: {
        fecha_vencimiento: {
          [Op.ne]: null,
          [Op.lte]: targetDate
        }
      },
      include: [{ model: Becario, as: 'becario', include: [{ model: Persona, as: 'persona' }] }]
    });

    let count = 0;
    for (const doc of documentos) {
      const existing = await Alarma.findOne({
        where: {
          tipo: 'DOCUMENTO_VENCIDO',
          entidad_relacionada: 'Documento',
          entidad_id: doc.id,
          estado: 'pendiente'
        }
      });

      if (!existing) {
        const nombreCompleto = doc.becario?.persona ? `${doc.becario.persona.nombre} ${doc.becario.persona.apellido}` : `Becario #${doc.becario_id}`;
        await Alarma.create({
          tipo: 'DOCUMENTO_VENCIDO',
          nivel: 'medio',
          titulo: `Documento Próximo a Vencer / Vencido: ${doc.tipo_documento}`,
          descripcion: `El documento ${doc.nombre_archivo} del becario ${nombreCompleto} vence el ${doc.fecha_vencimiento}.`,
          entidad_relacionada: 'Documento',
          entidad_id: doc.id,
          estado: 'pendiente'
        });
        count++;
      }
    }
    return count;
  }

  /**
   * Rule 4: Overdue payments -> Critical Alarm
   */
  static async evaluatePagosVencidos() {
    const pagosAtrasados = await Pago.findAll({
      where: {
        [Op.or]: [
          { estado: 'atrasado' },
          {
            estado: 'pendiente',
            fecha_vencimiento: { [Op.lt]: new Date() }
          }
        ]
      },
      include: [{ model: Becario, as: 'becario', include: [{ model: Persona, as: 'persona' }] }]
    });

    let count = 0;
    for (const pago of pagosAtrasados) {
      const existing = await Alarma.findOne({
        where: {
          tipo: 'PAGO_VENCIDO',
          entidad_relacionada: 'Pago',
          entidad_id: pago.id,
          estado: 'pendiente'
        }
      });

      if (!existing) {
        const nombreCompleto = pago.becario?.persona ? `${pago.becario.persona.nombre} ${pago.becario.persona.apellido}` : `Becario #${pago.becario_id}`;
        await Alarma.create({
          tipo: 'PAGO_VENCIDO',
          nivel: 'critico',
          titulo: `Pago Universitario Vencido: RD$ ${parseFloat(pago.monto).toLocaleString()}`,
          descripcion: `El pago de ${pago.concepto} por RD$ ${parseFloat(pago.monto).toLocaleString()} para ${nombreCompleto} está atrasado (venció ${pago.fecha_vencimiento}).`,
          entidad_relacionada: 'Pago',
          entidad_id: pago.id,
          estado: 'pendiente'
        });
        count++;
      }
    }
    return count;
  }
}

module.exports = AlarmEngineService;
