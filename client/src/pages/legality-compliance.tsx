import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { FileText, Shield, Save, ArrowLeft, Upload, Check } from 'lucide-react';
import { ObjectUploader } from '@/components/ObjectUploader';
import type { UploadResult } from '@uppy/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertLegalComplianceSchema, type InsertLegalCompliance } from '@shared/schema';
import { z } from 'zod';

// Section configuration matching DOCX template exactly
interface SectionItem {
  key: string;
  label: string;
  type: 'yesNo' | 'yesNoNA' | 'text' | 'textarea';
  required?: boolean;
  explanationKey?: string;
  explanation?: string;
  documentKey?: string; // For document upload URL
}

interface Section {
  id: string;
  title: string;
  items: SectionItem[];
}

const LEGAL_COMPLIANCE_SECTIONS: Section[] = [
  {
    id: '3.1',
    title: '3.1 Hak Penggunaan Tanah',
    items: [
      {
        key: 'historisPerolehanTanah',
        label: 'Apakah Perusahaan Memiliki Historis Perolehan Tanah',
        type: 'textarea',
        explanation: 'Lampirkan Dokumen : (dalam Bentuk Google Drive )'
      },
      {
        key: 'izinPencadangan',
        label: 'Izin Pencadangan Lahan',
        type: 'yesNo',
        required: true,
        explanationKey: 'izinPencadanganKeterangan',
        documentKey: 'izinPencadanganDokumen'
      },
      {
        key: 'persetujuanPKKPR',
        label: 'Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) / Izin Lokasi',
        type: 'yesNo',
        required: true,
        explanationKey: 'persetujuanPKKPRKeterangan',
        documentKey: 'persetujuanPKKPRDokumen'
      },
      {
        key: 'izinUsahaPerkebunan',
        label: 'Izin Usaha Perkebunan',
        type: 'yesNo',
        required: true,
        explanationKey: 'izinUsahaPerkebunanKeterangan',
        documentKey: 'izinUsahaPerkebunanDokumen'
      },
      {
        key: 'skHGU',
        label: 'SK HGU',
        type: 'yesNo',
        required: true,
        explanationKey: 'skHGUKeterangan',
        documentKey: 'skHGUDokumen'
      },
      {
        key: 'sertifikatHGU',
        label: 'Sertifikat HGU',
        type: 'yesNo',
        required: true,
        explanationKey: 'sertifikatHGUKeterangan',
        documentKey: 'sertifikatHGUDokumen'
      },
      {
        key: 'laporanPemanfaatanHGU',
        label: 'Laporan Pemanfaatan HGU',
        type: 'yesNo',
        required: true,
        explanationKey: 'laporanPemanfaatanHGUKeterangan',
        documentKey: 'laporanPemanfaatanHGUDokumen'
      },
      {
        key: 'laporanLPUP',
        label: 'Laporan Perkembangan Usaha Perkebunan (LPUP)',
        type: 'yesNo',
        required: true,
        explanationKey: 'laporanLPUPKeterangan',
        documentKey: 'laporanLPUPDokumen'
      }
    ]
  },
  {
    id: '3.2',
    title: '3.2 Perlindungan Lingkungan Hidup',
    items: [
      {
        key: 'izinLingkungan',
        label: 'Izin Lingkungan dan Dokumen Terkait',
        type: 'yesNo',
        required: true,
        explanationKey: 'izinLingkunganKeterangan',
        documentKey: 'izinLingkunganDokumen'
      },
      {
        key: 'izinRintekLimbahB3',
        label: 'Izin / Rintek TPS Limbah B3',
        type: 'yesNo',
        required: true,
        explanationKey: 'izinRintekLimbahB3Keterangan',
        documentKey: 'izinRintekLimbahB3Dokumen'
      },
      {
        key: 'izinPertekLimbahCair',
        label: 'Izin / Pertek Pengelolaan Limbah Cair Industri',
        type: 'yesNo',
        required: true,
        explanationKey: 'izinPertekLimbahCairKeterangan',
        documentKey: 'izinPertekLimbahCairDokumen'
      },
      {
        key: 'persetujuanAndalalin',
        label: 'Persetujuan Teknis ANDALALIN',
        type: 'yesNo',
        required: true,
        explanationKey: 'persetujuanAndalalinKeterangan',
        documentKey: 'persetujuanAndalalinDokumen'
      },
      {
        key: 'daftarPestisida',
        label: 'Daftar pestisida dan izin edar yang masih berlaku',
        type: 'yesNo',
        required: true,
        explanationKey: 'daftarPestisidaKeterangan',
        documentKey: 'daftarPestisidaDokumen'
      }
    ]
  },
  {
    id: '3.3',
    title: '3.3 Bukti Pelaksanaan',
    items: [
      {
        key: 'buktiPelaksanaanRKL',
        label: 'Laporan Pelaksanaan RKL/RPL',
        type: 'yesNo',
        required: true,
        explanationKey: 'buktiPelaksanaanRKLKeterangan',
        documentKey: 'buktiPelaksanaanRKLDokumen'
      },
      {
        key: 'laporanPenggunaanPestisida',
        label: 'Laporan Penggunaan Pestisida',
        type: 'yesNo',
        required: true,
        explanationKey: 'laporanPenggunaanPestisidaKeterangan',
        documentKey: 'laporanPenggunaanPestisidaDokumen'
      }
    ]
  },
  {
    id: '3.4',
    title: '3.4 Peraturan yang berhubungan dengan Kehutanan',
    items: [
      {
        key: 'areaSesuaiPeruntukan',
        label: 'Apakah area yang diusahakan sesuai dengan peruntukannya',
        type: 'yesNo',
        required: true,
        explanationKey: 'areaSesuaiPeruntukanKeterangan',
        documentKey: 'areaSesuaiPeruntukanDokumen'
      },
      {
        key: 'skPelepasan',
        label: 'SK Pelepasan/Tukar Menukar Kawasan Hutan (Jika Kawasan berasal dari kawasan hutan negara)',
        type: 'yesNo',
        required: true,
        explanationKey: 'skPelepasanKeterangan',
        documentKey: 'skPelepasanDokumen'
      },
      {
        key: 'dokumenInstansiRelevant',
        label: 'Dokumen yang dikeluarkan oleh Instansi relevan menunjukan kesesuain ruang area tanam (PKKPR, Risalah Panitia B, Tinjauan Teknis dari Kehutanan)',
        type: 'yesNo',
        required: true,
        explanationKey: 'dokumenInstansiRelevantKeterangan',
        documentKey: 'dokumenInstansiRelevantDokumen'
      }
    ]
  },
  {
    id: '3.5',
    title: '3.5 Hak Pihak Ke 3 termasuk Hak-Hak Masyarakat adat',
    items: [
      {
        key: 'kebijakanHakPihakKetiga',
        label: 'Apakah Perusahaan Memiliki Kebijakan Terkait Hak pihak ketiga, prinsip persetujuan awal tanpa paksaan dan berdasarkan informasi (FPIC), termasuk Hak-Hak Masyarakat Adat',
        type: 'yesNoNA',
        required: true,
        explanationKey: 'kebijakanHakPihakKetigaKeterangan',
        documentKey: 'kebijakanHakPihakKetigaDokumen'
      },
      {
        key: 'kebijakanPerusahaan',
        label: 'Kebijakan Perusahaan',
        type: 'yesNo',
        required: true,
        explanationKey: 'kebijakanPerusahaanKeterangan',
        documentKey: 'kebijakanPerusahaanDokumen'
      },
      {
        key: 'sopUsulanGRTT',
        label: 'SOP Usulan dan Persetujuan GRTT',
        type: 'yesNo',
        required: true,
        explanationKey: 'sopUsulanGRTTKeterangan',
        documentKey: 'sopUsulanGRTTDokumen'
      },
      {
        key: 'sopPADIATAPA',
        label: 'SOP Persetujuan Atas Dasar Informasi di Awal Tanpa Paksaan (PADIATAPA) & Pemetaan Partisipatif',
        type: 'yesNo',
        required: true,
        explanationKey: 'sopPADIATAPAKeterangan',
        documentKey: 'sopPADIATAPADokumen'
      },
      {
        key: 'sopPenangananInformasi',
        label: 'SOP Penanganan Permintaan Informasi',
        type: 'yesNo',
        required: true,
        explanationKey: 'sopPenangananInformasiKeterangan',
        documentKey: 'sopPenangananInformasiDokumen'
      },
      {
        key: 'sopPenangananKeluhan',
        label: 'SOP Penanganan Keluhan Stakeholder',
        type: 'yesNo',
        required: true,
        explanationKey: 'sopPenangananKeluhanKeterangan',
        documentKey: 'sopPenangananKeluhanDokumen'
      }
    ]
  },
  {
    id: '3.6',
    title: '3.6 Kewajiban Pengembangan Plasma minimum 20 % dari Lahan yang di Usahakan',
    items: [
      {
        key: 'mouKerjaSama',
        label: 'MoU Kerja sama',
        type: 'yesNo',
        required: true,
        explanationKey: 'mouKerjaSamaKeterangan',
        documentKey: 'mouKerjaSamaDokumen'
      },
      {
        key: 'skCPCL',
        label: 'SK CPCL (Calon Petani Calon Lahan)',
        type: 'yesNo',
        required: true,
        explanationKey: 'skCPCLKeterangan',
        documentKey: 'skCPCLDokumen'
      },
      {
        key: 'laporanRealisasiPlasma',
        label: 'Laporan Realisasi Plasma',
        type: 'yesNo',
        required: true,
        explanationKey: 'laporanRealisasiPlasmaKeterangan',
        documentKey: 'laporanRealisasiPlasmaDokumen',
        explanation: '(Dapat menggunakan Laporan SPUP)'
      }
    ]
  },
  {
    id: '3.7',
    title: '3.7 Bukti Implementasi Point 3.5',
    items: [
      {
        key: 'buktiImplementasi',
        label: 'Bukti Implementasi',
        type: 'textarea'
      }
    ]
  }
];

export default function LegalityCompliance() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState<Record<string, boolean>>({});

  // Form setup using react-hook-form with zodResolver
  const form = useForm<InsertLegalCompliance>({
    resolver: zodResolver(insertLegalComplianceSchema.extend({
      namaSupplier: z.string().min(1, 'Nama Supplier wajib diisi')
    })),
    defaultValues: {
      namaSupplier: '',
      namaGroup: '',
      aktaPendirianPerusahaan: '',
      aktaPerubahan: '',
      izinBerusaha: '',
      tipeSertifikat: '',
      alamatKantor: '',
      alamatKebun: '',
      koordinatKebun: '',
      koordinatKantor: '',
      namaPenanggungJawab: '',
      jabatanPenanggungJawab: '',
      emailPenanggungJawab: '',
      nomorTeleponPenanggungJawab: '',
      namaTimInternal: '',
      jabatanTimInternal: '',
      emailTimInternal: '',
      nomorTelefonTimInternal: '',
      historisPerolehanTanah: '',
      buktiImplementasi: '',
      status: 'draft',
      assessorName: 'KPN Compliance Administrator'
    }
  });

  // Create submission mutation
  const createLegalComplianceMutation = useMutation({
    mutationFn: async (data: InsertLegalCompliance) => {
      return await apiRequest('/api/legal-compliance', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/legal-compliance'] });
      toast({
        title: "Legal Compliance Berhasil Disimpan",
        description: "Formulir legal compliance telah berhasil disimpan.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Terjadi kesalahan saat menyimpan data",
        variant: "destructive",
      });
    }
  });

  // Handle document upload
  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest('/api/objects/upload', {
        method: 'POST'
      });
      return {
        method: 'PUT' as const,
        url: response.uploadURL || response.url || '',
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      throw error;
    }
  };

  const handleDocumentUpload = (documentKey: string) => 
    async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const documentUrl = uploadedFile.uploadURL || '';
        
        // Update the form with the document URL
        form.setValue(documentKey as keyof InsertLegalCompliance, documentUrl as any);
        
        toast({
          title: "Dokumen Berhasil Diunggah",
          description: `Dokumen telah berhasil diunggah dan disimpan.`,
        });
        
        setUploadingDocuments(prev => ({ ...prev, [documentKey]: false }));
      }
    };

  // Handle form submission
  const onSubmit = async (data: InsertLegalCompliance) => {
    setIsSubmitting(true);
    try {
      await createLegalComplianceMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Section renderer component
  const SectionRenderer = ({ section }: { section: Section }) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">{section.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {section.items.map((item) => {
          if (item.type === 'yesNo' || item.type === 'yesNoNA') {
            const options = item.type === 'yesNoNA' 
              ? [
                  { value: 'YA', label: 'Ya' },
                  { value: 'TIDAK', label: 'Tidak' },
                  { value: 'TIDAK_RELEVAN', label: 'Tidak relevan' }
                ]
              : [
                  { value: 'YA', label: 'Ya' },
                  { value: 'TIDAK', label: 'Tidak' }
                ];

            return (
              <div key={item.key} className="space-y-4">
                <FormField
                  control={form.control}
                  name={item.key as keyof InsertLegalCompliance}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        {item.label}
                        {item.required && <span className="text-red-500 ml-1">*</span>}
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={(field.value as string) || ''}
                          onValueChange={field.onChange}
                          className="flex gap-4"
                          data-testid={`radio-${item.key}`}
                        >
                          {options.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value={option.value} 
                                id={`${item.key}-${option.value}`}
                                data-testid={`radio-${item.key}-${option.value}`}
                              />
                              <Label htmlFor={`${item.key}-${option.value}`}>{option.label}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                      {item.explanation && (
                        <p className="text-xs text-gray-600">{item.explanation}</p>
                      )}
                    </FormItem>
                  )}
                />
                {/* Explanation field for radio buttons */}
                {item.explanationKey && (
                  <FormField
                    control={form.control}
                    name={item.explanationKey as keyof InsertLegalCompliance}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Keterangan:</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Masukkan keterangan..."
                            className="min-h-[80px]"
                            {...field}
                            value={field.value || ''}
                            data-testid={`textarea-${item.explanationKey}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Document upload for yes/no questions */}
                {item.documentKey && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Upload Dokumen Pendukung:
                    </Label>
                    <div className="flex items-center gap-3">
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={10485760} // 10MB
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={handleDocumentUpload(item.documentKey)}
                        buttonClassName="bg-blue-600 hover:bg-blue-700"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Dokumen
                      </ObjectUploader>
                      
                      {/* Show upload status or document name */}
                      {uploadingDocuments[item.documentKey] ? (
                        <span className="text-sm text-blue-600">Mengunggah...</span>
                      ) : form.watch(item.documentKey as keyof InsertLegalCompliance) ? (
                        <div className="flex items-center text-sm text-green-600">
                          <Check className="w-4 h-4 mr-1" />
                          Dokumen telah diunggah
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Belum ada dokumen</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          } else if (item.type === 'textarea' || item.type === 'text') {
            return (
              <FormField
                key={item.key}
                control={form.control}
                name={item.key as keyof InsertLegalCompliance}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {item.label}
                      {item.required && <span className="text-red-500 ml-1">*</span>}
                    </FormLabel>
                    <FormControl>
                      {item.type === 'textarea' ? (
                        <Textarea
                          placeholder="Masukkan informasi..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ''}
                          data-testid={`textarea-${item.key}`}
                        />
                      ) : (
                        <Input
                          placeholder="Masukkan informasi..."
                          {...field}
                          value={field.value || ''}
                          data-testid={`input-${item.key}`}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                    {item.explanation && (
                      <p className="text-xs text-gray-600">{item.explanation}</p>
                    )}
                  </FormItem>
                )}
              />
            );
          }
          return null;
        })}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-neutral-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
                Formulir Informasi Kepatuhan Hukum
              </h1>
              <p className="text-gray-600 mt-1">
                (Kebun Sendiri/Kebun Satu Manajemen Pengelolaan/Third-Partied)
              </p>
            </div>
            <Button 
              onClick={() => setLocation('/supply-chain-workflow')}
              variant="outline"
              data-testid="button-back-workflow"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workflow
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Company Information */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Informasi Perusahaan
                </CardTitle>
                <CardDescription>
                  Informasi dasar perusahaan yang diperlukan untuk formulir kepatuhan hukum
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="namaSupplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">
                          Nama Supplier
                          <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Masukkan nama supplier" 
                            {...field}
                            value={field.value || ''}
                            data-testid="input-nama-supplier"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="namaGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Nama Group / Parent Company Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Masukkan nama group" 
                            {...field}
                            value={field.value || ''}
                            data-testid="input-nama-group"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aktaPendirianPerusahaan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Akta Pendirian Perusahaan</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Masukkan akta pendirian" 
                            {...field}
                            value={field.value || ''}
                            data-testid="input-akta-pendirian"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aktaPerubahan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Akta Perubahan (Jika Ada)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Masukkan akta perubahan" 
                            {...field}
                            value={field.value || ''}
                            data-testid="input-akta-perubahan"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="izinBerusaha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Izin Berusaha (Nomor Induk Berusaha)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Masukkan izin berusaha" 
                            {...field}
                            value={field.value || ''}
                            data-testid="input-izin-berusaha"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tipeSertifikat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Tipe Sertifikat Yang Dimiliki Perusahan</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(ISPO/RSPO/ISCC/PROPER LINGKUNGAN,SMK3)" 
                            {...field}
                            value={field.value || ''}
                            data-testid="input-tipe-sertifikat"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="alamatKantor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Alamat Kantor</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Masukkan alamat kantor" 
                            className="min-h-[80px]"
                            {...field}
                            value={field.value || ''}
                            data-testid="textarea-alamat-kantor"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="alamatKebun"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Alamat Kebun</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Masukkan alamat kebun" 
                            className="min-h-[80px]"
                            {...field}
                            value={field.value || ''}
                            data-testid="textarea-alamat-kebun"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="koordinatKebun"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Koordinat Kebun</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Masukkan koordinat kebun" 
                            {...field}
                            value={field.value || ''}
                            data-testid="input-koordinat-kebun"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="koordinatKantor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Koordinat Kantor</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Masukkan koordinat kantor" 
                            {...field}
                            value={field.value || ''}
                            data-testid="input-koordinat-kantor"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jenisSupplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Jenis Supplier</FormLabel>
                        <FormControl>
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <SelectTrigger data-testid="select-jenis-supplier">
                              <SelectValue placeholder="Pilih jenis supplier" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kebun_plasma">Kebun plasma yang dikelola penuh oleh perusahaan (KKPA)</SelectItem>
                              <SelectItem value="kebun_sister_company">Kebun dalam satu grup manajemen (sister company)</SelectItem>
                              <SelectItem value="kebun_pihak_ketiga">Kebun pihak ketiga (PT/ CV/ Koperasi)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Penanggung Jawab */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Penanggung Jawab</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="namaPenanggungJawab"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Masukkan nama penanggung jawab" 
                              {...field}
                              value={field.value || ''}
                              data-testid="input-nama-penanggung-jawab"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="jabatanPenanggungJawab"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jabatan</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Masukkan jabatan" 
                              {...field}
                              value={field.value || ''}
                              data-testid="input-jabatan-penanggung-jawab"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emailPenanggungJawab"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="Masukkan email" 
                              {...field}
                              value={field.value || ''}
                              data-testid="input-email-penanggung-jawab"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nomorTeleponPenanggungJawab"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor Telepon / Handphone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Masukkan nomor telepon" 
                              {...field}
                              value={field.value || ''}
                              data-testid="input-telepon-penanggung-jawab"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Tim Internal */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="namaTimInternal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Masukkan nama tim internal" 
                              {...field}
                              value={field.value || ''}
                              data-testid="input-nama-tim-internal"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="jabatanTimInternal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jabatan</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Masukkan jabatan" 
                              {...field} 
                              data-testid="input-jabatan-tim-internal"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emailTimInternal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="Masukkan email" 
                              {...field} 
                              data-testid="input-email-tim-internal"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nomorTelefonTimInternal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor Telepon / Handphone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Masukkan nomor telepon" 
                              {...field} 
                              data-testid="input-telepon-tim-internal"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legal Compliance Sections 3.1-3.7 */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6" data-testid="text-legal-compliance-title">
                Legal Compliance
              </h2>
              <p className="text-gray-600 mb-6">
                Berlaku Untuk Perusahaan Yang Belum Sertifikasi ISPO
              </p>
              
              {LEGAL_COMPLIANCE_SECTIONS.map((section) => (
                <SectionRenderer key={section.id} section={section} />
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setLocation('/supply-chain-workflow')}
                data-testid="button-cancel"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                data-testid="button-submit-legal-compliance"
              >
                {isSubmitting ? (
                  <>Menyimpan...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Legal Compliance
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}