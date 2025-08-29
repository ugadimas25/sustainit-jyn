import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ObjectUploader } from '@/components/ObjectUploader';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, FileText, Upload, Download, Eye } from 'lucide-react';
import type { UploadResult } from '@uppy/core';


export default function LegalityCompliance() {
  const [activeTab, setActiveTab] = useState('supplier-compliance');
  const { toast } = useToast();

  const [supplierComplianceForm, setSupplierComplianceForm] = useState({
    // Basic Information
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
    jenisSupplier: '',
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTelefonPenanggungJawab: '',
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: '',
    
    // 3.1 Hak Penggunaan Tanah
    historisPerolehanTanah: '',
    historisKeterangan: '',
    izinPencadanganLahan: '',
    izinPencadanganKeterangan: '',
    persetujuanPKKPR: '',
    persetujuanPKKPRKeterangan: '',
    izinUsahaPerkebunan: '',
    izinUsahaPerkebunanKeterangan: '',
    skHGU: '',
    skHGUKeterangan: '',
    sertifikatHGU: '',
    sertifikatHGUKeterangan: '',
    laporanPemanfaatanHGU: '',
    laporanPemanfaatanHGUKeterangan: '',
    laporanLPUP: '',
    laporanLPUPKeterangan: '',
    
    // 3.2 Perlindungan Lingkungan Hidup
    izinLingkungan: '',
    izinLingkunganKeterangan: '',
    izinRintekTPS: '',
    izinRintekTPSKeterangan: '',
    izinPertekLimbah: '',
    izinPertekLimbahKeterangan: '',
    persetujuanAndalalin: '',
    persetujuanAndalalinKeterangan: '',
    daftarPestisida: '',
    daftarPestisidaKeterangan: '',
    
    // 3.3 Bukti Pelaksanaan
    buktiPelaksanaan: '',
    buktiPelaksanaanKeterangan: '',
    laporanRKLRPL: '',
    laporanRKLRPLKeterangan: '',
    laporanPestisida: '',
    laporanPestisidaKeterangan: '',
    
    // 3.4 Peraturan Kehutanan
    areaSesuaiPeruntukan: '',
    areaSesuaiPeruntukanKeterangan: '',
    skPelepasanHutan: '',
    skPelepasanHutanKeterangan: '',
    dokumenInstansiRelevant: '',
    dokumenInstansiRelevanKeterangan: '',
    
    // 3.5 Hak Pihak Ketiga dan Masyarakat Adat
    kebijakanHakPihakKetiga: '',
    kebijakanHakPihakKetigaKeterangan: '',
    kebijakanPerusahaan: '',
    kebijakanPerusahaanKeterangan: '',
    sopGRTT: '',
    sopGRTTKeterangan: '',
    sopPADIATAPA: '',
    sopPADIATAPAKeterangan: '',
    sopPermintaanInformasi: '',
    sopPermintaanInformasiKeterangan: '',
    sopKeluhanStakeholder: '',
    sopKeluhanStakeholderKeterangan: '',
    
    // 3.6 Kewajiban Pengembangan Plasma
    mouKerjaSama: '',
    mouKerjaSamaKeterangan: '',
    skCPCL: '',
    skCPCLKeterangan: '',
    laporanRealisasiPlasma: '',
    laporanRealisasiPlasmaKeterangan: '',
    
    // 3.7 Bukti Implementasi
    buktiGRTT: '',
    buktiGRTTKeterangan: '',
    buktiFPIC: '',
    buktiFPICKeterangan: '',
    suratMasukPermintaan: '',
    suratMasukPermintaanKeterangan: '',
    suratKeluarPermintaan: '',
    suratKeluarPermintaanKeterangan: '',
    suratMasukKeluhan: '',
    suratMasukKeluhanKeterangan: '',
    suratKeluarKeluhan: '',
    suratKeluarKeluhanKeterangan: '',
    
    // 3.8 Sengketa Lahan
    laporanSengketaLahan: '',
    laporanSengketaLahanKeterangan: '',
    
    // 3.9 Hak Buruh dan HAM
    komitmenHakBuruh: '',
    kebijakanHakBuruh: '',
    kebijakanHakBuruhKeterangan: '',
    sopKetenagakerjaan: '',
    sopKetenagakerjaanKeterangan: '',
    sopK3: '',
    sopK3Keterangan: '',
    
    // 3.10 Bukti Pelaksanaan HAM
    buktiPerjanjianKerja: '',
    buktiPerjanjianKerjaKeterangan: '',
    daftarKaryawan: '',
    daftarKaryawanKeterangan: '',
    skUMR: '',
    skUMRKeterangan: '',
    skSerikatPekerja: '',
    skSerikatPekerjaKeterangan: '',
    buktiBPJS: '',
    buktiBPJSKeterangan: '',
    laporanP2K3: '',
    laporanP2K3Keterangan: '',
    
    // 3.11 Perpajakan dan Antikorupsi
    komitmenAntikorupsi: '',
    kebijakanAntikorupsi: '',
    kebijakanAntikorupsiKeterangan: '',
    sopKodeEtik: '',
    sopKodeEtikKeterangan: '',
    saluranPengaduan: '',
    saluranPengaduanKeterangan: '',
    
    // 3.12 Bukti Pajak dan Ekspor
    suratTerdaftarPajak: '',
    suratTerdaftarPajakKeterangan: '',
    npwp: '',
    npwpKeterangan: '',
  });

  const createSupplierComplianceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/supplier-compliance', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplier-compliance'] });
      toast({
        title: "Data Supplier Compliance berhasil disimpan",
        description: "Data Kepatuhan Hukum Supplier telah berhasil disimpan ke sistem.",
      });
      setActiveTab('results');
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menyimpan data",
        description: error.message || "Terjadi kesalahan saat menyimpan data supplier compliance.",
        variant: "destructive",
      });
    },
  });

  const handleSupplierComplianceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSupplierComplianceMutation.mutate(supplierComplianceForm);
  };

  const handleGetUploadParameters = async () => {
    try {
      const response = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      throw error;
    }
  };

  const handleDocumentUploadComplete = (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
    fieldName: string
  ) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.response?.uploadURL || uploadedFile.uploadURL || '';
      const objectPath = uploadURL.includes('/uploads/') ? 
        `/objects${uploadURL.split('/uploads')[1]}` : uploadURL;
      
      setSupplierComplianceForm(prev => ({ ...prev, [fieldName]: objectPath }));
      
      toast({
        title: "Dokumen berhasil diunggah",
        description: `Dokumen untuk ${fieldName} telah berhasil diunggah.`,
      });
    }
  };

  // Dummy data for results table
  const dummySupplierComplianceData = [
    {
      id: 1,
      namaSupplier: 'PT Kebun Kelapa Sawit Sejahtera',
      tingkatKepatuhan: 85,
      statusKepatuhan: 'Compliant',
      tanggalPenilaian: '15 November 2024',
      nomorTelefonTimInternal: '+62 811-2345-6789',
      emailKontak: 'compliance@kebun-sejahtera.co.id'
    },
    {
      id: 2,
      namaSupplier: 'CV Perkebunan Nusantara',
      tingkatKepatuhan: 92,
      statusKepatuhan: 'Highly Compliant',
      tanggalPenilaian: '18 November 2024',
      nomorTelefonTimInternal: '+62 812-3456-7890',
      emailKontak: 'legal@perkebunan-nusantara.co.id'
    },
    {
      id: 3,
      namaSupplier: 'Koperasi Tani Mandiri',
      tingkatKepatuhan: 68,
      statusKepatuhan: 'Partially Compliant',
      tanggalPenilaian: '20 November 2024',
      nomorTeleponTimInternal: '+62 813-4567-8901',
      emailKontak: 'koperasi@tani-mandiri.co.id'
    }
  ];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Legality Compliance</h1>
          <p className="text-gray-600">
            Sistem penilaian kepatuhan hukum supplier untuk memastikan compliance dengan regulasi EUDR
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="supplier-compliance" data-testid="tab-supplier-compliance">Supplier Compliance</TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results">Hasil Penilaian</TabsTrigger>
          </TabsList>

          {/* Supplier Compliance Tab */}
          <TabsContent value="supplier-compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Formulir Informasi Kepatuhan Hukum</CardTitle>
                <CardDescription>
                  (Kebun Sendiri/Kebun Satu Manajemen Pengelolaan/Third-Partied)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSupplierComplianceSubmit} className="space-y-8">
                  {/* Basic Information Section - Exact format from document */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Nama Supplier :</Label>
                        <Input
                          value={supplierComplianceForm.namaSupplier}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, namaSupplier: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Nama Group / Parent Company Name :</Label>
                        <Input
                          value={supplierComplianceForm.namaGroup}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Akta Pendirian Perusahaan :</Label>
                        <Input
                          value={supplierComplianceForm.aktaPendirianPerusahaan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, aktaPendirianPerusahaan: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Akta Perubahan (Jika Ada) :</Label>
                        <Input
                          value={supplierComplianceForm.aktaPerubahan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, aktaPerubahan: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Izin Berusaha (Nomor Induk Berusaha) :</Label>
                        <Input
                          value={supplierComplianceForm.izinBerusaha}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Tipe Sertifikat Yang Dimiliki Perusahaan :</Label>
                        <Input
                          value={supplierComplianceForm.tipeSertifikat}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, tipeSertifikat: e.target.value }))}
                          placeholder="(ISPO/RSPO/ISCC/PROPER LINGKUNGAN,SMK3)"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium text-lg">Alamat</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Kantor :</Label>
                          <Textarea
                            value={supplierComplianceForm.alamatKantor}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Kebun :</Label>
                          <Textarea
                            value={supplierComplianceForm.alamatKebun}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, alamatKebun: e.target.value }))}
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium text-lg">Koordinat</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Kebun :</Label>
                          <Input
                            value={supplierComplianceForm.koordinatKebun}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, koordinatKebun: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Kantor :</Label>
                          <Input
                            value={supplierComplianceForm.koordinatKantor}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, koordinatKantor: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium">Jenis supplier :</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="kkpa"
                            name="jenisSupplier"
                            value="kkpa"
                            checked={supplierComplianceForm.jenisSupplier === 'kkpa'}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jenisSupplier: e.target.value }))}
                          />
                          <Label htmlFor="kkpa">Kebun plasma yang dikelola penuh oleh perusahaan (KKPA)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="sister"
                            name="jenisSupplier"
                            value="sister"
                            checked={supplierComplianceForm.jenisSupplier === 'sister'}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jenisSupplier: e.target.value }))}
                          />
                          <Label htmlFor="sister">Kebun dalam satu grup manajemen (sister company)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="third-party"
                            name="jenisSupplier"
                            value="third-party"
                            checked={supplierComplianceForm.jenisSupplier === 'third-party'}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jenisSupplier: e.target.value }))}
                          />
                          <Label htmlFor="third-party">Kebun pihak ketiga (PT/ CV/ Koperasi)</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium text-lg">Penanggung Jawab</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Nama :</Label>
                          <Input
                            value={supplierComplianceForm.namaPenanggungJawab}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, namaPenanggungJawab: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Jabatan :</Label>
                          <Input
                            value={supplierComplianceForm.jabatanPenanggungJawab}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jabatanPenanggungJawab: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Email :</Label>
                          <Input
                            type="email"
                            value={supplierComplianceForm.emailPenanggungJawab}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, emailPenanggungJawab: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Nomor Telfon / Handphone :</Label>
                          <Input
                            value={supplierComplianceForm.nomorTelefonPenanggungJawab}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, nomorTelefonPenanggungJawab: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium text-lg">Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahaan</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Nama :</Label>
                          <Input
                            value={supplierComplianceForm.namaTimInternal}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, namaTimInternal: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Jabatan :</Label>
                          <Input
                            value={supplierComplianceForm.jabatanTimInternal}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jabatanTimInternal: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Email :</Label>
                          <Input
                            type="email"
                            value={supplierComplianceForm.emailTimInternal}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, emailTimInternal: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Nomor Telfon / Handphone :</Label>
                          <Input
                            value={supplierComplianceForm.nomorTeleponTimInternal}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, nomorTelefonTimInternal: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-8" />

                  {/* Legal Compliance Section */}
                  <div className="space-y-8">
                    <h2 className="text-xl font-bold text-center">Legal Compliance</h2>
                    <p className="text-center font-medium">Berlaku Untuk Perusahaan Yang Belum Sertifikasi ISPO</p>

                    {/* 3.1 Hak Penggunaan Tanah */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">Hak Penggunaan Tanah</h3>
                      <div className="space-y-4">
                        <Label className="font-medium">3.1 Apakah Perusahaan Memiliki Historis Perolehan Tanah</Label>
                        <div className="space-y-2">
                          <Label>Keterangan:</Label>
                          <Textarea
                            value={supplierComplianceForm.historisKeterangan}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, historisKeterangan: e.target.value }))}
                            rows={2}
                          />
                          <div className="space-y-2">
                            <Label>Upload Dokumen Pendukung:</Label>
                            <ObjectUploader
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleDocumentUploadComplete(result, 'historisKeteranganDokumen')}
                              maxFileSize={50 * 1024 * 1024}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload PDF Dokumen
                            </ObjectUploader>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Lampirkan Dokumen: (dalam Bentuk Google Drive)</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'historisPerolehanTanah')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      {/* Izin Pencadangan Lahan */}
                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Izin Pencadangan Lahan</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="izinPencadangan-ya"
                              name="izinPencadanganLahan"
                              value="ya"
                              checked={supplierComplianceForm.izinPencadanganLahan === 'ya'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinPencadanganLahan: e.target.value }))}
                            />
                            <Label htmlFor="izinPencadangan-ya">☑ Ya</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="izinPencadangan-tidak"
                              name="izinPencadanganLahan"
                              value="tidak"
                              checked={supplierComplianceForm.izinPencadanganLahan === 'tidak'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinPencadanganLahan: e.target.value }))}
                            />
                            <Label htmlFor="izinPencadangan-tidak">☑ Tidak</Label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Keterangan:</Label>
                          <Textarea
                            value={supplierComplianceForm.izinPencadanganKeterangan}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinPencadanganKeterangan: e.target.value }))}
                            rows={2}
                          />
                          <div className="space-y-2">
                            <Label>Upload Dokumen Pendukung:</Label>
                            <ObjectUploader
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleDocumentUploadComplete(result, 'izinPencadanganKeteranganDokumen')}
                              maxFileSize={50 * 1024 * 1024}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload PDF Dokumen
                            </ObjectUploader>
                          </div>
                        </div>
                      </div>

                      {/* Continue with all sections from the document... */}
                      <div className="grid grid-cols-1 gap-6">
                        {/* PKKPR */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) / Izin Lokasi</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="pkkpr-ya"
                                name="persetujuanPKKPR"
                                value="ya"
                                checked={supplierComplianceForm.persetujuanPKKPR === 'ya'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanPKKPR: e.target.value }))}
                              />
                              <Label htmlFor="pkkpr-ya">☑ Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="pkkpr-tidak"
                                name="persetujuanPKKPR"
                                value="tidak"
                                checked={supplierComplianceForm.persetujuanPKKPR === 'tidak'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanPKKPR: e.target.value }))}
                              />
                              <Label htmlFor="pkkpr-tidak">☑ Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.persetujuanPKKPRKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanPKKPRKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'persetujuanPKKPRKeteranganDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* Izin Usaha Perkebunan */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">Izin Usaha Perkebunan</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinUsaha-ya"
                                name="izinUsahaPerkebunan"
                                value="ya"
                                checked={supplierComplianceForm.izinUsahaPerkebunan === 'ya'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinUsahaPerkebunan: e.target.value }))}
                              />
                              <Label htmlFor="izinUsaha-ya">☑ Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinUsaha-tidak"
                                name="izinUsahaPerkebunan"
                                value="tidak"
                                checked={supplierComplianceForm.izinUsahaPerkebunan === 'tidak'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinUsahaPerkebunan: e.target.value }))}
                              />
                              <Label htmlFor="izinUsaha-tidak">☑ Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinUsahaPerkebunanKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinUsahaPerkebunanKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'izinUsahaPerkebunanKeteranganDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* SK HGU */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">SK HGU</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skHGU-ya"
                                name="skHGU"
                                value="ya"
                                checked={supplierComplianceForm.skHGU === 'ya'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skHGU: e.target.value }))}
                              />
                              <Label htmlFor="skHGU-ya">☑ Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skHGU-tidak"
                                name="skHGU"
                                value="tidak"
                                checked={supplierComplianceForm.skHGU === 'tidak'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skHGU: e.target.value }))}
                              />
                              <Label htmlFor="skHGU-tidak">☑ Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.skHGUKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skHGUKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'skHGUKeteranganDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* Sertifikat HGU */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">Sertifikat HGU</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sertifikatHGU-ya"
                                name="sertifikatHGU"
                                value="ya"
                                checked={supplierComplianceForm.sertifikatHGU === 'ya'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sertifikatHGU: e.target.value }))}
                              />
                              <Label htmlFor="sertifikatHGU-ya">☑ Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sertifikatHGU-tidak"
                                name="sertifikatHGU"
                                value="tidak"
                                checked={supplierComplianceForm.sertifikatHGU === 'tidak'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sertifikatHGU: e.target.value }))}
                              />
                              <Label htmlFor="sertifikatHGU-tidak">☑ Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.sertifikatHGUKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sertifikatHGUKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'sertifikatHGUKeteranganDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3.2 Perlindungan Lingkungan Hidup */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">Perlindungan Lingkungan Hidup</h3>
                      <div className="space-y-4">
                        <Label className="font-medium">3.2 Apakah Perusahaan Memiliki Perizinan Lingkungan Sesuai dengan Regulasi yang Relevan</Label>
                        
                        {/* Izin Lingkungan dan Dokumen Terkait */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">Izin Lingkungan dan Dokumen Terkait</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinLingkungan-ya"
                                name="izinLingkungan"
                                value="ya"
                                checked={supplierComplianceForm.izinLingkungan === 'ya'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLingkungan: e.target.value }))}
                              />
                              <Label htmlFor="izinLingkungan-ya">☑ Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinLingkungan-tidak"
                                name="izinLingkungan"
                                value="tidak"
                                checked={supplierComplianceForm.izinLingkungan === 'tidak'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLingkungan: e.target.value }))}
                              />
                              <Label htmlFor="izinLingkungan-tidak">☑ Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinLingkunganKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLingkunganKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'izinLingkunganKeteranganDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* Izin/Rintek TPS Limbah B3 */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">Izin / Rintek TPS Limbah B3</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinRintek-ya"
                                name="izinRintekTPS"
                                value="ya"
                                checked={supplierComplianceForm.izinRintekTPS === 'ya'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinRintekTPS: e.target.value }))}
                              />
                              <Label htmlFor="izinRintek-ya">☑ Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinRintek-tidak"
                                name="izinRintekTPS"
                                value="tidak"
                                checked={supplierComplianceForm.izinRintekTPS === 'tidak'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinRintekTPS: e.target.value }))}
                              />
                              <Label htmlFor="izinRintek-tidak">☑ Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinRintekTPSKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinRintekTPSKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'izinRintekTPSKeteranganDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* Document Upload for All Sections */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">Upload Dokumen Pendukung</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'dokumenLingkungan')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen Lingkungan
                          </ObjectUploader>
                        </div>
                      </div>
                    </div>

                    {/* 3.3 Bukti Pelaksanaan */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">3.3 Bukti Pelaksanaan</h3>
                      
                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Bukti Pelaksanaan RKL-RPL</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="buktiPelaksanaan-ya"
                              name="buktiPelaksanaan"
                              value="ya"
                              checked={supplierComplianceForm.buktiPelaksanaan === 'ya'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiPelaksanaan: e.target.value }))}
                            />
                            <Label htmlFor="buktiPelaksanaan-ya">☑ Ya</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="buktiPelaksanaan-tidak"
                              name="buktiPelaksanaan"
                              value="tidak"
                              checked={supplierComplianceForm.buktiPelaksanaan === 'tidak'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiPelaksanaan: e.target.value }))}
                            />
                            <Label htmlFor="buktiPelaksanaan-tidak">☑ Tidak</Label>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.buktiPelaksanaanKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiPelaksanaanKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'buktiPelaksanaanKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Laporan RKL-RPL</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="laporanRKLRPL-ya"
                              name="laporanRKLRPL"
                              value="ya"
                              checked={supplierComplianceForm.laporanRKLRPL === 'ya'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRKLRPL: e.target.value }))}
                            />
                            <Label htmlFor="laporanRKLRPL-ya">☑ Ya</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="laporanRKLRPL-tidak"
                              name="laporanRKLRPL"
                              value="tidak"
                              checked={supplierComplianceForm.laporanRKLRPL === 'tidak'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRKLRPL: e.target.value }))}
                            />
                            <Label htmlFor="laporanRKLRPL-tidak">☑ Tidak</Label>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.laporanRKLRPLKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRKLRPLKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'laporanRKLRPLKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Laporan Penggunaan Pestisida</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="laporanPestisida-ya"
                              name="laporanPestisida"
                              value="ya"
                              checked={supplierComplianceForm.laporanPestisida === 'ya'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPestisida: e.target.value }))}
                            />
                            <Label htmlFor="laporanPestisida-ya">☑ Ya</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="laporanPestisida-tidak"
                              name="laporanPestisida"
                              value="tidak"
                              checked={supplierComplianceForm.laporanPestisida === 'tidak'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPestisida: e.target.value }))}
                            />
                            <Label htmlFor="laporanPestisida-tidak">☑ Tidak</Label>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.laporanPestisidaKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPestisidaKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'laporanPestisidaKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>
                    </div>

                    {/* 3.4 Peraturan Kehutanan */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">3.4 Peraturan Kehutanan</h3>
                      
                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Area Sesuai Peruntukan</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="areaSesuaiPeruntukan-ya"
                              name="areaSesuaiPeruntukan"
                              value="ya"
                              checked={supplierComplianceForm.areaSesuaiPeruntukan === 'ya'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, areaSesuaiPeruntukan: e.target.value }))}
                            />
                            <Label htmlFor="areaSesuaiPeruntukan-ya">☑ Ya</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="areaSesuaiPeruntukan-tidak"
                              name="areaSesuaiPeruntukan"
                              value="tidak"
                              checked={supplierComplianceForm.areaSesuaiPeruntukan === 'tidak'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, areaSesuaiPeruntukan: e.target.value }))}
                            />
                            <Label htmlFor="areaSesuaiPeruntukan-tidak">☑ Tidak</Label>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.areaSesuaiPeruntukanKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, areaSesuaiPeruntukanKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'areaSesuaiPeruntukanKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">SK Pelepasan Hutan</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="skPelepasanHutan-ya"
                              name="skPelepasanHutan"
                              value="ya"
                              checked={supplierComplianceForm.skPelepasanHutan === 'ya'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skPelepasanHutan: e.target.value }))}
                            />
                            <Label htmlFor="skPelepasanHutan-ya">☑ Ya</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="skPelepasanHutan-tidak"
                              name="skPelepasanHutan"
                              value="tidak"
                              checked={supplierComplianceForm.skPelepasanHutan === 'tidak'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skPelepasanHutan: e.target.value }))}
                            />
                            <Label htmlFor="skPelepasanHutan-tidak">☑ Tidak</Label>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.skPelepasanHutanKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skPelepasanHutanKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'skPelepasanHutanKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Dokumen Instansi Relevan</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="dokumenInstansiRelevant-ya"
                              name="dokumenInstansiRelevant"
                              value="ya"
                              checked={supplierComplianceForm.dokumenInstansiRelevant === 'ya'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, dokumenInstansiRelevant: e.target.value }))}
                            />
                            <Label htmlFor="dokumenInstansiRelevant-ya">☑ Ya</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="dokumenInstansiRelevant-tidak"
                              name="dokumenInstansiRelevant"
                              value="tidak"
                              checked={supplierComplianceForm.dokumenInstansiRelevant === 'tidak'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, dokumenInstansiRelevant: e.target.value }))}
                            />
                            <Label htmlFor="dokumenInstansiRelevant-tidak">☑ Tidak</Label>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.dokumenInstansiRelevanKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, dokumenInstansiRelevanKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'dokumenInstansiRelevanKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>
                    </div>

                    {/* 3.5 Hak Pihak Ketiga dan Masyarakat Adat */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">3.5 Hak Pihak Ketiga dan Masyarakat Adat</h3>
                      
                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Kebijakan Hak Pihak Ketiga</Label>
                        <Input
                          value={supplierComplianceForm.kebijakanHakPihakKetiga}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanHakPihakKetiga: e.target.value }))}
                          placeholder="Masukkan kebijakan hak pihak ketiga"
                        />
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.kebijakanHakPihakKetigaKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanHakPihakKetigaKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'kebijakanHakPihakKetigaKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Kebijakan Perusahaan</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="kebijakanPerusahaan-ya"
                              name="kebijakanPerusahaan"
                              value="ya"
                              checked={supplierComplianceForm.kebijakanPerusahaan === 'ya'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanPerusahaan: e.target.value }))}
                            />
                            <Label htmlFor="kebijakanPerusahaan-ya">☑ Ya</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="kebijakanPerusahaan-tidak"
                              name="kebijakanPerusahaan"
                              value="tidak"
                              checked={supplierComplianceForm.kebijakanPerusahaan === 'tidak'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanPerusahaan: e.target.value }))}
                            />
                            <Label htmlFor="kebijakanPerusahaan-tidak">☑ Tidak</Label>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.kebijakanPerusahaanKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanPerusahaanKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'kebijakanPerusahaanKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">SOP GRTT</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="sopGRTT-ya"
                              name="sopGRTT"
                              value="ya"
                              checked={supplierComplianceForm.sopGRTT === 'ya'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopGRTT: e.target.value }))}
                            />
                            <Label htmlFor="sopGRTT-ya">☑ Ya</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="sopGRTT-tidak"
                              name="sopGRTT"
                              value="tidak"
                              checked={supplierComplianceForm.sopGRTT === 'tidak'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopGRTT: e.target.value }))}
                            />
                            <Label htmlFor="sopGRTT-tidak">☑ Tidak</Label>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.sopGRTTKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopGRTTKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'sopGRTTKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>
                    </div>

                    {/* 3.6-3.12 Additional Sections */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">3.6 Kewajiban Pengembangan Plasma</h3>
                      
                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">MOU Kerjasama</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="mouKerjaSama-ya"
                              name="mouKerjaSama"
                              value="ya"
                              checked={supplierComplianceForm.mouKerjaSama === 'ya'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, mouKerjaSama: e.target.value }))}
                            />
                            <Label htmlFor="mouKerjaSama-ya">☑ Ya</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="mouKerjaSama-tidak"
                              name="mouKerjaSama"
                              value="tidak"
                              checked={supplierComplianceForm.mouKerjaSama === 'tidak'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, mouKerjaSama: e.target.value }))}
                            />
                            <Label htmlFor="mouKerjaSama-tidak">☑ Tidak</Label>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.mouKerjaSamaKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, mouKerjaSamaKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'mouKerjaSamaKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">SK CPCL</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="skCPCL-ya"
                              name="skCPCL"
                              value="ya"
                              checked={supplierComplianceForm.skCPCL === 'ya'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skCPCL: e.target.value }))}
                            />
                            <Label htmlFor="skCPCL-ya">☑ Ya</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="skCPCL-tidak"
                              name="skCPCL"
                              value="tidak"
                              checked={supplierComplianceForm.skCPCL === 'tidak'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skCPCL: e.target.value }))}
                            />
                            <Label htmlFor="skCPCL-tidak">☑ Tidak</Label>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.skCPCLKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skCPCLKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'skCPCLKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Laporan Realisasi Plasma</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="laporanRealisasiPlasma-ya"
                              name="laporanRealisasiPlasma"
                              value="ya"
                              checked={supplierComplianceForm.laporanRealisasiPlasma === 'ya'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRealisasiPlasma: e.target.value }))}
                            />
                            <Label htmlFor="laporanRealisasiPlasma-ya">☑ Ya</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="laporanRealisasiPlasma-tidak"
                              name="laporanRealisasiPlasma"
                              value="tidak"
                              checked={supplierComplianceForm.laporanRealisasiPlasma === 'tidak'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRealisasiPlasma: e.target.value }))}
                            />
                            <Label htmlFor="laporanRealisasiPlasma-tidak">☑ Tidak</Label>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.laporanRealisasiPlasmaKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRealisasiPlasmaKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'laporanRealisasiPlasmaKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>
                    </div>

                    {/* 3.7 Bukti Implementasi */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">3.7 Bukti Implementasi</h3>
                      
                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Bukti GRTT</Label>
                        <Input
                          value={supplierComplianceForm.buktiGRTT}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiGRTT: e.target.value }))}
                          placeholder="Masukkan bukti GRTT"
                        />
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.buktiGRTTKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiGRTTKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'buktiGRTTKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Bukti FPIC</Label>
                        <Input
                          value={supplierComplianceForm.buktiFPIC}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiFPIC: e.target.value }))}
                          placeholder="Masukkan bukti FPIC"
                        />
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.buktiFPICKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiFPICKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'buktiFPICKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>
                    </div>

                    {/* 3.8 Sengketa Lahan */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">3.8 Sengketa Lahan</h3>
                      
                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Laporan Sengketa Lahan</Label>
                        <Input
                          value={supplierComplianceForm.laporanSengketaLahan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanSengketaLahan: e.target.value }))}
                          placeholder="Masukkan laporan sengketa lahan"
                        />
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.laporanSengketaLahanKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanSengketaLahanKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'laporanSengketaLahanKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>
                    </div>

                    {/* 3.9 Hak Buruh dan HAM */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">3.9 Hak Buruh dan HAM</h3>
                      
                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Komitmen Hak Buruh</Label>
                        <Input
                          value={supplierComplianceForm.komitmenHakBuruh}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, komitmenHakBuruh: e.target.value }))}
                          placeholder="Masukkan komitmen hak buruh"
                        />
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Kebijakan Hak Buruh</Label>
                        <Input
                          value={supplierComplianceForm.kebijakanHakBuruh}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanHakBuruh: e.target.value }))}
                          placeholder="Masukkan kebijakan hak buruh"
                        />
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.kebijakanHakBuruhKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanHakBuruhKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'kebijakanHakBuruhKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">SOP Ketenagakerjaan</Label>
                        <Input
                          value={supplierComplianceForm.sopKetenagakerjaan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopKetenagakerjaan: e.target.value }))}
                          placeholder="Masukkan SOP ketenagakerjaan"
                        />
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.sopKetenagakerjaanKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopKetenagakerjaanKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'sopKetenagakerjaanKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">SOP K3</Label>
                        <Input
                          value={supplierComplianceForm.sopK3}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopK3: e.target.value }))}
                          placeholder="Masukkan SOP K3"
                        />
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.sopK3Keterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopK3Keterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'sopK3KeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>
                    </div>

                    {/* 3.10 Bukti Pelaksanaan HAM */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">3.10 Bukti Pelaksanaan HAM</h3>
                      
                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Bukti Perjanjian Kerja</Label>
                        <Input
                          value={supplierComplianceForm.buktiPerjanjianKerja}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiPerjanjianKerja: e.target.value }))}
                          placeholder="Masukkan bukti perjanjian kerja"
                        />
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.buktiPerjanjianKerjaKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiPerjanjianKerjaKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'buktiPerjanjianKerjaKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Daftar Karyawan</Label>
                        <Input
                          value={supplierComplianceForm.daftarKaryawan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, daftarKaryawan: e.target.value }))}
                          placeholder="Masukkan daftar karyawan"
                        />
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.daftarKaryawanKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, daftarKaryawanKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'daftarKaryawanKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">SK UMR</Label>
                        <Input
                          value={supplierComplianceForm.skUMR}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skUMR: e.target.value }))}
                          placeholder="Masukkan SK UMR"
                        />
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.skUMRKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skUMRKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'skUMRKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Bukti BPJS</Label>
                        <Input
                          value={supplierComplianceForm.buktiBPJS}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiBPJS: e.target.value }))}
                          placeholder="Masukkan bukti BPJS"
                        />
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.buktiBPJSKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiBPJSKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'buktiBPJSKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>
                    </div>

                    {/* 3.11 Perpajakan dan Antikorupsi */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">3.11 Perpajakan dan Antikorupsi</h3>
                      
                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Komitmen Antikorupsi</Label>
                        <Input
                          value={supplierComplianceForm.komitmenAntikorupsi}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, komitmenAntikorupsi: e.target.value }))}
                          placeholder="Masukkan komitmen antikorupsi"
                        />
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Kebijakan Antikorupsi</Label>
                        <Input
                          value={supplierComplianceForm.kebijakanAntikorupsi}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanAntikorupsi: e.target.value }))}
                          placeholder="Masukkan kebijakan antikorupsi"
                        />
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.kebijakanAntikorupsiKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanAntikorupsiKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'kebijakanAntikorupsiKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">SOP Kode Etik</Label>
                        <Input
                          value={supplierComplianceForm.sopKodeEtik}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopKodeEtik: e.target.value }))}
                          placeholder="Masukkan SOP kode etik"
                        />
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.sopKodeEtikKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopKodeEtikKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'sopKodeEtikKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Saluran Pengaduan</Label>
                        <Input
                          value={supplierComplianceForm.saluranPengaduan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, saluranPengaduan: e.target.value }))}
                          placeholder="Masukkan saluran pengaduan"
                        />
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.saluranPengaduanKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, saluranPengaduanKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'saluranPengaduanKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>
                    </div>

                    {/* 3.12 Bukti Pajak dan Ekspor */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">3.12 Bukti Pajak dan Ekspor</h3>
                      
                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">Surat Terdaftar Pajak</Label>
                        <Input
                          value={supplierComplianceForm.suratTerdaftarPajak}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratTerdaftarPajak: e.target.value }))}
                          placeholder="Masukkan surat terdaftar pajak"
                        />
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.suratTerdaftarPajakKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratTerdaftarPajakKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'suratTerdaftarPajakKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-medium">NPWP</Label>
                        <Input
                          value={supplierComplianceForm.npwp}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, npwp: e.target.value }))}
                          placeholder="Masukkan NPWP"
                        />
                        <Textarea
                          placeholder="Keterangan"
                          value={supplierComplianceForm.npwpKeterangan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, npwpKeterangan: e.target.value }))}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label>Upload Dokumen Pendukung:</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'npwpKeteranganDokumen')}
                            maxFileSize={50 * 1024 * 1024}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Dokumen
                          </ObjectUploader>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <Button 
                      type="submit" 
                      data-testid="button-submit-supplier-compliance"
                      className="w-full" 
                      disabled={createSupplierComplianceMutation.isPending}
                    >
                      {createSupplierComplianceMutation.isPending ? 'Menyimpan...' : 'Simpan Data Supplier Compliance'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hasil Penilaian Kepatuhan Supplier</CardTitle>
                <CardDescription>
                  Daftar supplier yang telah dinilai tingkat kepatuhannya terhadap regulasi hukum
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Supplier</TableHead>
                        <TableHead>Tingkat Kepatuhan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal Penilaian</TableHead>
                        <TableHead>Kontak</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dummySupplierComplianceData.map((compliance) => (
                        <TableRow key={compliance.id}>
                          <TableCell className="font-medium">{compliance.namaSupplier}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-12 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    compliance.tingkatKepatuhan >= 90 ? 'bg-green-500' : 
                                    compliance.tingkatKepatuhan >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${compliance.tingkatKepatuhan}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{compliance.tingkatKepatuhan}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={compliance.tingkatKepatuhan >= 90 ? 'default' : compliance.tingkatKepatuhan >= 75 ? 'secondary' : 'destructive'}>
                              {compliance.statusKepatuhan}
                            </Badge>
                          </TableCell>
                          <TableCell>{compliance.tanggalPenilaian}</TableCell>
                          <TableCell className="text-sm">
                            <div>{compliance.nomorTelefonTimInternal}</div>
                            <div className="text-muted-foreground">{compliance.emailKontak}</div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}