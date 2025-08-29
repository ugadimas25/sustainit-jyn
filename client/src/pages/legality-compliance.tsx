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