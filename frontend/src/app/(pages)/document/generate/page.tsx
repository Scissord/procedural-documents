'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@/components';
import { Send, Download, HelpCircle } from 'lucide-react';

export default function DocumentGeneratePage() {
  const [formData, setFormData] = useState({
    insuranceCompany: '',
    insuranceAddress: '',
    fullName: '',
    residentialAddress: '',
    phone: '',
    email: '',
    creditDate: '',
    bankName: '',
    creditNumber: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownload = () => {
    // Логика скачивания документа без заполнения
    console.log('Скачать без заполнения');
  };

  const handleHelp = () => {
    // Логика помощи юриста
    console.log('Помощь юриста');
  };

  const handleSend = () => {
    // Логика отправки документа
    console.log('Отправить', formData);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Кнопки вверху */}
      <div className="flex justify-center gap-4 mb-6">
        <Button
          onClick={handleDownload}
          variant="default"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Download className="mr-2 h-4 w-4" />
          Скачать без заполнения
        </Button>
        <Button
          onClick={handleHelp}
          variant="default"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          Помощь юриста
        </Button>
      </div>

      {/* Основной контент: форма и превью */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Левая колонка - Форма */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="insuranceCompany">
              Полное фирменное наименование страховой компании
            </Label>
            <Input
              id="insuranceCompany"
              value={formData.insuranceCompany}
              onChange={(e) =>
                handleInputChange('insuranceCompany', e.target.value)
              }
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="insuranceAddress">
              Адрес страховой организации
            </Label>
            <Input
              id="insuranceAddress"
              value={formData.insuranceAddress}
              onChange={(e) =>
                handleInputChange('insuranceAddress', e.target.value)
              }
              className="mt-1"
              placeholder="/-----/"
            />
          </div>

          <div>
            <Label htmlFor="fullName">Ваши фамилия, имя, отчество</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="mt-1"
              placeholder="/-----/"
            />
          </div>

          <div>
            <Label htmlFor="residentialAddress">Ваш адрес проживания</Label>
            <Input
              id="residentialAddress"
              value={formData.residentialAddress}
              onChange={(e) =>
                handleInputChange('residentialAddress', e.target.value)
              }
              className="mt-1"
              placeholder="/-----/"
            />
          </div>

          <div>
            <Label htmlFor="phone">Укажите ваш телефон</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="mt-1"
              placeholder="/-----/"
            />
          </div>

          <div>
            <Label htmlFor="email">Укажите вашу эл. почту</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="mt-1"
              placeholder="/-----/"
            />
          </div>

          <div>
            <Label htmlFor="creditDate">
              Дата заключения кредитного договора
            </Label>
            <Input
              id="creditDate"
              type="date"
              value={formData.creditDate}
              onChange={(e) => handleInputChange('creditDate', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="bankName">
              Полное фирменное наименование Банка
            </Label>
            <Input
              id="bankName"
              value={formData.bankName}
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              className="mt-1"
              placeholder="/-----/"
            />
          </div>

          <div>
            <Label htmlFor="creditNumber">Номер кредитного договора</Label>
            <Input
              id="creditNumber"
              value={formData.creditNumber}
              onChange={(e) =>
                handleInputChange('creditNumber', e.target.value)
              }
              className="mt-1"
              placeholder="/-----/"
            />
          </div>
        </div>

        {/* Правая колонка - Превью документа */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4 text-sm leading-relaxed">
            {/* Адрес получателя */}
            <div className="text-right mb-4">
              <div className="font-semibold">
                {formData.insuranceCompany || '/-----/'}
              </div>
              <div>Адрес: {formData.insuranceAddress || '/-----/'}</div>
              <div>/-----/</div>
              <div>/-----/</div>
            </div>

            {/* Заголовок */}
            <div className="text-center font-bold text-lg mb-4">Заявление</div>

            {/* Текст документа */}
            <div className="space-y-2">
              <p>{formData.fullName || '/-----/'}</p>
              <p>{formData.residentialAddress || '/-----/'}</p>
              <p>Телефон: {formData.phone || '/-----/'}</p>
              <p>Эл. почта: {formData.email || '/-----/'}</p>
            </div>

            <div className="mt-6 space-y-2">
              <p>
                {formData.creditDate
                  ? `«${new Date(formData.creditDate).toLocaleDateString('ru-RU')}»`
                  : '/-----/'}{' '}
                мной был заключен кредитный договор №{' '}
                {formData.creditNumber || '/-----/'} с{' '}
                {formData.bankName || '/-----/'}, в соответствии с которым мне
                был предоставлен кредит на сумму /-----/ руб. с установленной
                процентной ставкой /-----/%.
              </p>
              <p>
                Одновременно с кредитным договором мной был заключен договор
                страхования с {formData.insuranceCompany || '/-----/'},
                предусматривающий страхование следующих страховых рисков:
                /-----/.
              </p>
              <p>
                Страховая премия в размере /-----/ руб. была уплачена мной
                единовременно и включена в сумму кредита.
              </p>
              <p>
                В соответствии с условиями кредитного договора мной досрочно
                были исполнены все обязательства перед Банком, что
                подтверждается справкой об отсутствии задолженности, выданной
                Банком /-----/.
              </p>
              <p>
                В связи с досрочным исполнением обязательств по кредитному
                договору договор страхования прекратил свое действие досрочно.
              </p>
              <p>
                В соответствии с частью 11 статьи 7 Федерального закона N 353-ФЗ
                "О потребительском кредите (займе)" при досрочном возврате
                потребительского кредита (займа) заемщик имеет право требовать
                от страховщика возврата части уплаченной страховой премии
                пропорционально не истекшему периоду действия договора
                страхования.
              </p>
              <p>
                На основании изложенного, руководствуясь частью 11 статьи 7
                Федерального закона N 353-ФЗ "О потребительском кредите
                (займе)", прошу вернуть мне денежные средства в размере
                страховой премии пропорционально не истекшему периоду действия
                договора страхования.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка отправки */}
      <div className="flex justify-end mt-6">
        <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700">
          <Send className="mr-2 h-4 w-4" />
          Отправить
        </Button>
      </div>
    </div>
  );
}
