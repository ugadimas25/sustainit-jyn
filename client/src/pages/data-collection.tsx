import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ObjectUploader } from '@/components/ObjectUploader';
import { FileText, Upload, Satellite, Plus, Trash2 } from 'lucide-react';
import type { UploadResult } from '@uppy/core';

export default function DataCollection() {
  const [supplierType, setSupplierType] = useState('');
  const { toast } = useToast();

  // Form states for all collection types
  const [estateForm, setEstateForm] = useState({
    // Bagian 1 - Informasi Umum
    namaSupplier: '',
    namaGroup: '',
    aktaPendirian: '', // document URL
    aktaPerubahan: '', // document URL
    izinBerusaha: '', // NIB
    
    // Alamat
    alamatKantor: '',
    alamatKebun: '',
    
    // Koordinat
    koordinatKebun: '',
    koordinatKantor: '',
    
    // Jenis supplier
    jenisSupplier: '', // KKPA/Sister Company/Pihak Ketiga (checkboxes)
    totalProduksiTBSTahun: '',
    
    // Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahaan
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTelefonTimInternal: '',
    
    // Penanggung Jawab
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTelefonPenanggungJawab: '',
    
    // Tanda Tangan
    tandaTangan: '',
    tanggalPengisianKuisioner: '',
    
    // Bagian 2 - Sumber TBS (Daftar Kebun)
    daftarKebun: [{
      no: 1,
      namaKebun: '',
      alamat: '',
      longitude: '',
      latitude: '',
      polygonKebun: '',
      luasLahan: 0, // Ha
      tahunTanam: '',
      jenisBibit: '',
      produksiTBS1Tahun: ''
    }]
  });

  const [smallholdersForm, setSmallholdersForm] = useState({
    // Form Kemampuan Telusur (Traceability) TBS Luar - Unit Usaha Kecil Menengah/Small Medium Enterprise
    // Informasi DO
    nomorDO: '',
    pemegangDO: '',
    alamatPemegangDO: '',
    lokasiUsaha: '', // Lokasi Ramp / Alamat Terdaftar CV / Koperasi / Usaha Individu
    
    // Legalitas Pemegang DO
    aktaPendirianUsaha: '', // document URL (Jika Berbadan Hukum)
    nib: '',
    npwp: '',
    ktp: '', // document URL
    
    // Volume dan Luas
    luasLahanTertanamPetaniSupplier: 0, // Ha
    volumeTBS: 0, // MT
    
    // Daftar Petani Pemasok TBS (matching exact template structure)
    daftarPetaniPemasok: [{
      no: 1,
      namaPetani: '',
      alamatTempatTinggal: '',
      lokasiKebun: '',
      luas: 0, // Ha
      legalitasLahan: '', // document URL - 3 types: STDB, SPPL, Nomor Objek Pajak PBB
      tahunTanam: '',
      stdb: '', // document URL
      sppl: '', // document URL  
      nomorObjekPajakPBB: '',
      longitude: '',
      latitude: '',
      polygon: ''
    }]
  });

  const [millForm, setMillForm] = useState({
    // Bagian 1 - Informasi Umum
    umlId: '',
    namaPabrik: '',
    namaGroup: '',
    aktaPendirian: '', // document URL
    aktaPerubahan: '', // document URL
    izinBerusaha: '', // NIB
    tipeSertifikat: '', // ISPO/RSPO/ISCC/PROPER LINGKUNGAN,SMK3
    nomorSertifikat: '',
    lembagaSertifikasi: '',
    ruangLingkupSertifikasi: '',
    masaBerlakuSertifikat: '',
    
    // Alamat
    alamatKantor: '',
    alamatPabrik: '',
    
    // Koordinat
    koordinatPabrik: '',
    koordinatKantor: '',
    
    // Jenis supplier
    jenisSupplier: '', // KKPA/Sister Company/Pihak Ketiga
    kuantitasCPOPK: '', // M/T
    tanggalPengisianKuisioner: '',
    
    // Penanggung Jawab
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTeleponPenanggungJawab: '',
    
    // Tim Internal
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTelefonTimInternal: '',
    
    // Additional fields for new structure
    jenisSupplierKKPA: false,
    jenisSupplierSisterCompany: false,
    jenisSupplierPihakKetiga: false,
    tandaTangan: '',
    
    // Kebun arrays
    kebunInti: [{
      namaSupplier: '',
      alamat: '',
      luasPlotLahan: 0,
      longitude: '',
      latitude: '',
      polygonKebun: '',
      persenPasokanKeMill: 0,
      volumeTBSPasokan: '',
      dokumenLegalitasLahan: '',
      tahunTanam: ''
    }]
  });

  const [kcpForm, setKcpForm] = useState({
    ublFacilityId: '',
    namaKCP: '',
    namaGroup: '',
    izinBerusaha: '',
    tipeSertifikat: '',
    nomorSertifikat: '',
    lembagaSertifikasi: '',
    ruangLingkupSertifikasi: '',
    masaBerlakuSertifikat: '',
    alamatKantor: '',
    alamatKCP: '',
    koordinatKantor: '',
    koordinatKCP: '',
    modelChainOfCustody: '',
    kapasitasOlahMTHari: 0,
    kapasitasOlah: 0,
    sistemPencatatan: '',
    tanggalPengisianKuisioner: '',
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTeleponPenanggungJawab: '',
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: '',
    
    // Additional fields
    tandaTangan: '',
    
    // Arrays
    daftarTangki: [{
      idTangki: '',
      kategori: '',
      produk: '',
      alamat: '',
      longitude: '',
      latitude: '',
      kapasitas: 0
    }],
    
    sumberProduk: [{
      millId: '',
      namaPKS: '',
      alamat: '',
      longitude: '',
      latitude: '',
      produk: '',
      volume: 0
    }]
  });

  const [bulkingForm, setBulkingForm] = useState({
    ublFacilityId: '',
    namaFasilitasBulking: '',
    namaGroup: '',
    izinBerusaha: '',
    tipeSertifikat: '',
    nomorSertifikat: '',
    lembagaSertifikasi: '',
    ruangLingkupSertifikasi: '',
    masaBerlakuSertifikat: '',
    alamatKantor: '',
    alamatBulking: '',
    alamatFasilitas: '',
    koordinatKantor: '',
    koordinatFasilitas: '',
    modelChainOfCustody: '',
    kapasitasTotal: 0,
    sistemPencatatan: '',
    tanggalPengisianKuisioner: '',
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTeleponPenanggungJawab: '',
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: '',
    
    // Additional fields
    tandaTangan: '',
    
    // Arrays
    daftarTangki: [{
      tankId: '',
      produk: '',
      kapasitas: 0,
      longitude: '',
      latitude: ''
    }],
    
    sumberProduk: [{
      millId: '',
      namaPKS: '',
      alamat: '',
      longitude: '',
      latitude: '',
      produk: '',
      volume: 0
    }]
  });

  // Mutations for creating data collections
  const createEstateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/estate-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/estate-data-collection'] });
      toast({
        title: "Data Estate berhasil disimpan",
        description: "Data Estate telah berhasil disimpan ke sistem.",
      });
      // Reset form
      setEstateForm({
        namaSupplier: '', namaGroup: '', aktaPendirian: '', aktaPerubahan: '', izinBerusaha: '',
        alamatKantor: '', alamatKebun: '', koordinatKebun: '', koordinatKantor: '', 
        jenisSupplier: '', totalProduksiTBSTahun: '', tanggalPengisianKuisioner: '',
        namaPenanggungJawab: '', jabatanPenanggungJawab: '', emailPenanggungJawab: '', nomorTeleponPenanggungJawab: '',
        namaTimInternal: '', jabatanTimInternal: '', emailTimInternal: '', nomorTeleponTimInternal: '',
        
        // Reset dynamic arrays
        daftarKebun: [{
          no: 1, namaKebun: '', alamat: '', luas: 0, longitude: '', latitude: '', polygon: '', 
          legalitasLahan: '', tahunTanam: ''
        }]
      });
    },
  });

  const createSmallholdersMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/traceability-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/traceability-data-collection'] });
      toast({
        title: "Data Smallholders berhasil disimpan",
        description: "Data Smallholders telah berhasil disimpan ke sistem.",
      });
      // Reset form
      setSmallholdersForm({
        nomorDO: '', pemegangDO: '', alamatPemegangDO: '', lokasiUsaha: '', aktaPendirianUsaha: '',
        nib: '', npwp: '', ktp: '', 
        luasLahanTertanamPetaniSupplier: 0, volumeTBS: 0,
        daftarPetaniPemasok: [{ 
          no: 1, namaPetani: '', alamatTempatTinggal: '', lokasiKebun: '', luas: 0, 
          legalitasLahan: '', tahunTanam: '', stdb: '', sppl: '', nomorObjekPajakPBB: '', 
          longitude: '', latitude: '', polygon: ''
        }]
      });
    },
  });

  const createMillMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/mill-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mill-data-collection'] });
      toast({
        title: "Data Mill berhasil disimpan",
        description: "Data Mill telah berhasil disimpan ke sistem.",
      });
    },
  });

  const createKcpMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/kcp-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kcp-data-collection'] });
      toast({
        title: "Data KCP berhasil disimpan",
        description: "Data KCP telah berhasil disimpan ke sistem.",
      });
    },
  });

  const createBulkingMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/bulking-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bulking-data-collection'] });
      toast({
        title: "Data Bulking berhasil disimpan",
        description: "Data Bulking telah berhasil disimpan ke sistem.",
      });
    },
  });

  // Document upload functionality
  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest('/api/objects/upload', 'POST');
      return {
        method: 'PUT' as const,
        url: response.url || response.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      throw error;
    }
  };

  const handleDocumentUploadComplete = (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
    fieldName: string,
    formType: 'estate' | 'mill' | 'smallholders' | 'kcp' | 'bulking'
  ) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = (uploadedFile as any).response?.url || (uploadedFile as any).uploadURL || '';
      const objectPath = uploadURL.includes('/uploads/') ? 
        `/objects/uploads/${uploadURL.split('/uploads/')[1]}` : 
        `/objects/uploads/${uploadedFile.id || 'unknown'}`;
      
      if (formType === 'estate') {
        setEstateForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'mill') {
        setMillForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'smallholders') {
        setSmallholdersForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'kcp') {
        setKcpForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'bulking') {
        setBulkingForm(prev => ({ ...prev, [fieldName]: objectPath }));
      }
      
      toast({
        title: "Dokumen berhasil diunggah",
        description: `Dokumen telah disimpan dan terhubung dengan formulir ${formType}.`,
      });
    }
  };

  // Note: Kebun management moved to Spatial Analysis step

  // Add Pemasok function
  const addPemasok = () => {
    setSmallholdersForm(prev => ({
      ...prev,
      daftarPetaniPemasok: [
        ...prev.daftarPetaniPemasok,
        {
          no: prev.daftarPetaniPemasok.length + 1,
          namaPetani: '',
          alamatTempatTinggal: '',
          lokasiKebun: '',
          luas: 0,
          legalitasLahan: '',
          tahunTanam: '',
          stdb: '',
          sppl: '',
          nomorObjekPajakPBB: '',
          longitude: '',
          latitude: '',
          polygon: ''
        }
      ]
    }));
  };

  // Remove Pemasok function
  const removePemasok = (index: number) => {
    setSmallholdersForm(prev => ({
      ...prev,
      daftarPetaniPemasok: prev.daftarPetaniPemasok.filter((_, i) => i !== index).map((pemasok, i) => ({ ...pemasok, no: i + 1 }))
    }));
  };

  const handleEstateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEstateMutation.mutate(estateForm);
  };

  const handleSmallholdersSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSmallholdersMutation.mutate(smallholdersForm);
  };

  const handleMillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMillMutation.mutate(millForm);
  };

  const handleKcpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createKcpMutation.mutate(kcpForm);
  };

  const handleBulkingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBulkingMutation.mutate(bulkingForm);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 data-testid="text-page-title" className="text-3xl font-bold">
            Data Collection
          </h1>
          <p data-testid="text-page-description" className="text-muted-foreground mt-2">
            Sistem pengumpulan data komprehensif untuk kepatuhan EUDR dengan kemampuan unggah dokumen
          </p>
        </div>

        {/* Supplier Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Supplier Type</CardTitle>
            <CardDescription>
              Choose the supplier type to display the relevant data collection form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={supplierType} onValueChange={setSupplierType}>
              <SelectTrigger className="w-full max-w-md" data-testid="select-supplier-type">
                <SelectValue placeholder="Select supplier type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="estate">Estate</SelectItem>
                <SelectItem value="mill">Mill</SelectItem>
                <SelectItem value="smallholders">Smallholders</SelectItem>
                <SelectItem value="kcp">KCP</SelectItem>
                <SelectItem value="bulking">Bulking</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Conditional Form Rendering */}
        {supplierType === 'estate' && (
          <Card>
            <CardHeader>
              <CardTitle>Formulir Pengumpulan Data Estate</CardTitle>
              <CardDescription>
                (Kebun Sendiri/Kebun Satu Manajemen Pengelolaan/Third-Partied)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEstateSubmit} className="space-y-8">
                {/* Bagian 1 - Informasi Umum */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 1 – Informasi Umum</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaSupplier">Nama Supplier</Label>
                      <Input
                        id="namaSupplier"
                        data-testid="input-nama-supplier-estate"
                        value={estateForm.namaSupplier}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, namaSupplier: e.target.value }))}
                        placeholder="Masukkan nama supplier"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="namaGroup">Nama Group / Parent Company Name</Label>
                      <Input
                        id="namaGroup"
                        data-testid="input-nama-group-estate"
                        value={estateForm.namaGroup}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                        placeholder="Masukkan nama group/parent company"
                      />
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Dokumen Perusahaan</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Akta Pendirian Perusahaan</Label>
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result: any) => handleDocumentUploadComplete(result, 'aktaPendirian', 'estate')}
                          maxFileSize={10 * 1024 * 1024}
                        >
                          Upload File
                        </ObjectUploader>
                        {estateForm.aktaPendirian && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileText size={16} />
                            <span>Dokumen telah diunggah</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Akta Perubahan (Jika Ada)</Label>
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result: any) => handleDocumentUploadComplete(result, 'aktaPerubahan', 'estate')}
                          maxFileSize={10 * 1024 * 1024}
                        >
                          Upload File
                        </ObjectUploader>
                        {estateForm.aktaPerubahan && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileText size={16} />
                            <span>Dokumen telah diunggah</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="izinBerusaha">Izin Berusaha (Nomor Induk Berusaha)</Label>
                    <Input
                      id="izinBerusaha"
                      data-testid="input-izin-berusaha-estate"
                      value={estateForm.izinBerusaha}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                      placeholder="Masukkan NIB"
                    />
                  </div>

                  {/* Alamat Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Alamat</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="alamatKantor">Kantor</Label>
                        <Textarea
                          id="alamatKantor"
                          data-testid="input-alamat-kantor-estate"
                          value={estateForm.alamatKantor}
                          onChange={(e) => setEstateForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                          placeholder="Masukkan alamat kantor lengkap"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="alamatKebun">Kebun</Label>
                        <Textarea
                          id="alamatKebun"
                          data-testid="input-alamat-kebun-estate"
                          value={estateForm.alamatKebun}
                          onChange={(e) => setEstateForm(prev => ({ ...prev, alamatKebun: e.target.value }))}
                          placeholder="Masukkan alamat kebun lengkap"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Koordinat Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Koordinat</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="koordinatKebun">Kebun</Label>
                        <Input
                          id="koordinatKebun"
                          data-testid="input-koordinat-kebun-estate"
                          value={estateForm.koordinatKebun}
                          onChange={(e) => setEstateForm(prev => ({ ...prev, koordinatKebun: e.target.value }))}
                          placeholder="Latitude, Longitude"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="koordinatKantor">Kantor</Label>
                        <Input
                          id="koordinatKantor"
                          data-testid="input-koordinat-kantor-estate"
                          value={estateForm.koordinatKantor}
                          onChange={(e) => setEstateForm(prev => ({ ...prev, koordinatKantor: e.target.value }))}
                          placeholder="Latitude, Longitude"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Jenis Supplier Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Jenis Supplier</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={estateForm.jenisSupplier === 'kkpa'}
                          onChange={(e) => setEstateForm(prev => ({ ...prev, jenisSupplier: e.target.checked ? 'kkpa' : '' }))}
                          className="rounded"
                        />
                        <span>Kebun plasma yang dikelola penuh oleh perusahaan (KKPA)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={estateForm.jenisSupplier === 'sister-company'}
                          onChange={(e) => setEstateForm(prev => ({ ...prev, jenisSupplier: e.target.checked ? 'sister-company' : '' }))}
                          className="rounded"
                        />
                        <span>Kebun dalam satu grup manajemen (sister company)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={estateForm.jenisSupplier === 'pihak-ketiga'}
                          onChange={(e) => setEstateForm(prev => ({ ...prev, jenisSupplier: e.target.checked ? 'pihak-ketiga' : '' }))}
                          className="rounded"
                        />
                        <span>Kebun pihak ketiga (PT/ CV/ Koperasi)</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalProduksiTBSTahun">Total Produksi TBS / Tahun (kurun 1 tahun terakhir)</Label>
                    <Input
                      id="totalProduksiTBSTahun"
                      data-testid="input-total-produksi-tbs-estate"
                      value={estateForm.totalProduksiTBSTahun}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, totalProduksiTBSTahun: e.target.value }))}
                      placeholder="Masukkan total produksi TBS dalam MT/tahun"
                    />
                  </div>

                  {/* Tim Internal Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahaan</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="namaTimInternal">Nama</Label>
                        <Input
                          id="namaTimInternal"
                          value={estateForm.namaTimInternal}
                          onChange={(e) => setEstateForm(prev => ({ ...prev, namaTimInternal: e.target.value }))}
                          placeholder="Masukkan nama tim internal"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jabatanTimInternal">Jabatan</Label>
                        <Input
                          id="jabatanTimInternal"
                          value={estateForm.jabatanTimInternal}
                          onChange={(e) => setEstateForm(prev => ({ ...prev, jabatanTimInternal: e.target.value }))}
                          placeholder="Masukkan jabatan"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailTimInternal">Email</Label>
                        <Input
                          id="emailTimInternal"
                          type="email"
                          value={estateForm.emailTimInternal}
                          onChange={(e) => setEstateForm(prev => ({ ...prev, emailTimInternal: e.target.value }))}
                          placeholder="Masukkan email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nomorTelefonTimInternal">Nomor Telpon / Handphone</Label>
                        <Input
                          id="nomorTelefonTimInternal"
                          value={estateForm.nomorTelefonTimInternal}
                          onChange={(e) => setEstateForm(prev => ({ ...prev, nomorTelefonTimInternal: e.target.value }))}
                          placeholder="Masukkan nomor telepon"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Penanggung Jawab Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Penanggung Jawab</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="namaPenanggungJawab">Nama</Label>
                        <Input
                          id="namaPenanggungJawab"
                          value={estateForm.namaPenanggungJawab}
                          onChange={(e) => setEstateForm(prev => ({ ...prev, namaPenanggungJawab: e.target.value }))}
                          placeholder="Masukkan nama penanggung jawab"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jabatanPenanggungJawab">Jabatan</Label>
                        <Input
                          id="jabatanPenanggungJawab"
                          value={estateForm.jabatanPenanggungJawab}
                          onChange={(e) => setEstateForm(prev => ({ ...prev, jabatanPenanggungJawab: e.target.value }))}
                          placeholder="Masukkan jabatan"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailPenanggungJawab">Email</Label>
                        <Input
                          id="emailPenanggungJawab"
                          type="email"
                          value={estateForm.emailPenanggungJawab}
                          onChange={(e) => setEstateForm(prev => ({ ...prev, emailPenanggungJawab: e.target.value }))}
                          placeholder="Masukkan email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nomorTelefonPenanggungJawab">Nomor Telpon / Handphone</Label>
                        <Input
                          id="nomorTelefonPenanggungJawab"
                          value={estateForm.nomorTelefonPenanggungJawab}
                          onChange={(e) => setEstateForm(prev => ({ ...prev, nomorTelefonPenanggungJawab: e.target.value }))}
                          placeholder="Masukkan nomor telepon"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tanda Tangan Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Tanda Tangan</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="tanggalPengisianKuisioner">Tanggal Pengisian</Label>
                        <Input
                          id="tanggalPengisianKuisioner"
                          type="date"
                          value={estateForm.tanggalPengisianKuisioner}
                          onChange={(e) => setEstateForm(prev => ({ ...prev, tanggalPengisianKuisioner: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tandaTangan">TTD</Label>
                        <Input
                          id="tandaTangan"
                          value={estateForm.tandaTangan}
                          onChange={(e) => setEstateForm(prev => ({ ...prev, tandaTangan: e.target.value }))}
                          placeholder="Nama penandatangan"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bagian 2 - Sumber TBS */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 2 – Sumber TBS</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">Daftar kebun yang menjadi sumber TBS</p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const newKebun = {
                            no: estateForm.daftarKebun.length + 1,
                            namaKebun: '',
                            alamat: '',
                            longitude: '',
                            latitude: '',
                            polygonKebun: '',
                            luasLahan: 0,
                            tahunTanam: '',
                            jenisBibit: '',
                            produksiTBS1Tahun: ''
                          };
                          setEstateForm(prev => ({
                            ...prev,
                            daftarKebun: [...prev.daftarKebun, newKebun]
                          }));
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Kebun
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {estateForm.daftarKebun.map((kebun, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="font-medium">Kebun #{kebun.no}</h5>
                            {estateForm.daftarKebun.length > 1 && (
                              <Button 
                                type="button" 
                                variant="destructive" 
                                size="sm"
                                onClick={() => {
                                  const newDaftarKebun = estateForm.daftarKebun.filter((_, i) => i !== index);
                                  // Renumber remaining kebun
                                  const renumbered = newDaftarKebun.map((k, i) => ({ ...k, no: i + 1 }));
                                  setEstateForm(prev => ({ ...prev, daftarKebun: renumbered }));
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Nama Kebun</Label>
                              <Input
                                value={kebun.namaKebun}
                                onChange={(e) => {
                                  const newDaftarKebun = [...estateForm.daftarKebun];
                                  newDaftarKebun[index].namaKebun = e.target.value;
                                  setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                }}
                                placeholder="Nama kebun"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Alamat</Label>
                              <Input
                                value={kebun.alamat}
                                onChange={(e) => {
                                  const newDaftarKebun = [...estateForm.daftarKebun];
                                  newDaftarKebun[index].alamat = e.target.value;
                                  setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                }}
                                placeholder="Alamat kebun"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Luas Lahan (Ha)</Label>
                              <Input
                                type="number"
                                value={kebun.luasLahan}
                                onChange={(e) => {
                                  const newDaftarKebun = [...estateForm.daftarKebun];
                                  newDaftarKebun[index].luasLahan = parseFloat(e.target.value) || 0;
                                  setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                }}
                                placeholder="Luas dalam Ha"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Longitude</Label>
                              <Input
                                value={kebun.longitude}
                                onChange={(e) => {
                                  const newDaftarKebun = [...estateForm.daftarKebun];
                                  newDaftarKebun[index].longitude = e.target.value;
                                  setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                }}
                                placeholder="Longitude"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Latitude</Label>
                              <Input
                                value={kebun.latitude}
                                onChange={(e) => {
                                  const newDaftarKebun = [...estateForm.daftarKebun];
                                  newDaftarKebun[index].latitude = e.target.value;
                                  setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                }}
                                placeholder="Latitude"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Tahun Tanam</Label>
                              <Input
                                value={kebun.tahunTanam}
                                onChange={(e) => {
                                  const newDaftarKebun = [...estateForm.daftarKebun];
                                  newDaftarKebun[index].tahunTanam = e.target.value;
                                  setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                }}
                                placeholder="Tahun tanam"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Jenis Bibit</Label>
                              <Input
                                value={kebun.jenisBibit}
                                onChange={(e) => {
                                  const newDaftarKebun = [...estateForm.daftarKebun];
                                  newDaftarKebun[index].jenisBibit = e.target.value;
                                  setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                }}
                                placeholder="Jenis bibit"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Produksi TBS 1 Tahun Terakhir</Label>
                              <Input
                                value={kebun.produksiTBS1Tahun}
                                onChange={(e) => {
                                  const newDaftarKebun = [...estateForm.daftarKebun];
                                  newDaftarKebun[index].produksiTBS1Tahun = e.target.value;
                                  setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                }}
                                placeholder="Produksi TBS dalam MT"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Polygon Kebun</Label>
                              <Input
                                value={kebun.polygonKebun}
                                onChange={(e) => {
                                  const newDaftarKebun = [...estateForm.daftarKebun];
                                  newDaftarKebun[index].polygonKebun = e.target.value;
                                  setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                }}
                                placeholder="SHP/GeoJSON (jika > 4Ha)"
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    
                    <div className="text-xs text-gray-500 italic">
                      Keterangan: *) Jika lebih dari 4Ha, data Polygon (SHP/GeoJSON)
                    </div>
                  </div>
                </div>


                <div className="flex justify-end">
                  <Button type="submit" disabled={createEstateMutation.isPending} data-testid="button-submit-estate">
                    {createEstateMutation.isPending ? 'Menyimpan...' : 'Simpan Data Estate'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {supplierType === 'smallholders' && (
          <Card>
            <CardHeader>
              <CardTitle>Form Kemampuan Telusur (Traceability) TBS Luar</CardTitle>
              <CardDescription>
                Unit Usaha Kecil Menengah/Small Medium Enterprise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSmallholdersSubmit} className="space-y-8">
                {/* Informasi DO */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Informasi DO</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nomorDO">Nomor DO</Label>
                      <Input
                        id="nomorDO"
                        data-testid="input-nomor-do-smallholders"
                        value={smallholdersForm.nomorDO}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, nomorDO: e.target.value }))}
                        placeholder="Masukkan nomor DO"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pemegangDO">Pemegang DO</Label>
                      <Input
                        id="pemegangDO"
                        data-testid="input-pemegang-do-smallholders"
                        value={smallholdersForm.pemegangDO}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, pemegangDO: e.target.value }))}
                        placeholder="Masukkan pemegang DO"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="alamatPemegangDO">Alamat Pemegang DO</Label>
                      <Textarea
                        id="alamatPemegangDO"
                        data-testid="input-alamat-pemegang-do-smallholders"
                        value={smallholdersForm.alamatPemegangDO}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, alamatPemegangDO: e.target.value }))}
                        placeholder="Masukkan alamat pemegang DO"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lokasiUsaha">Lokasi Ramp / Alamat Terdaftar CV / Koperasi / Usaha Individu</Label>
                      <Textarea
                        id="lokasiUsaha"
                        data-testid="input-lokasi-usaha-smallholders"
                        value={smallholdersForm.lokasiUsaha}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, lokasiUsaha: e.target.value }))}
                        placeholder="Masukkan lokasi usaha"
                      />
                    </div>
                  </div>
                </div>

                {/* Legalitas Pemegang DO */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Legalitas Pemegang DO</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nib">NIB</Label>
                      <Input
                        id="nib"
                        data-testid="input-nib-smallholders"
                        value={smallholdersForm.nib}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, nib: e.target.value }))}
                        placeholder="Masukkan NIB"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="npwp">NPWP</Label>
                      <Input
                        id="npwp"
                        data-testid="input-npwp-smallholders"
                        value={smallholdersForm.npwp}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, npwp: e.target.value }))}
                        placeholder="Masukkan NPWP"
                      />
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Dokumen Legalitas</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Akta Pendirian Usaha (Jika Berbadan Hukum)</Label>
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result: any) => handleDocumentUploadComplete(result, 'aktaPendirianUsaha', 'smallholders')}
                          maxFileSize={10 * 1024 * 1024}
                        >
                          Upload File
                        </ObjectUploader>
                        {smallholdersForm.aktaPendirianUsaha && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileText size={16} />
                            <span>Dokumen telah diunggah</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>KTP</Label>
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result: any) => handleDocumentUploadComplete(result, 'ktp', 'smallholders')}
                          maxFileSize={5 * 1024 * 1024}
                        >
                          Upload File
                        </ObjectUploader>
                        {smallholdersForm.ktp && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileText size={16} />
                            <span>Dokumen telah diunggah</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Volume dan Luas */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Volume dan Luas</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="luasLahanTertanamPetaniSupplier">Luas Lahan Tertanam Petani Supplier (Ha)</Label>
                      <Input
                        id="luasLahanTertanamPetaniSupplier"
                        type="number"
                        step="0.01"
                        data-testid="input-luas-lahan-smallholders"
                        value={smallholdersForm.luasLahanTertanamPetaniSupplier}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, luasLahanTertanamPetaniSupplier: parseFloat(e.target.value) || 0 }))}
                        placeholder="Masukkan luas lahan dalam Ha"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="volumeTBS">Volume TBS (MT)</Label>
                      <Input
                        id="volumeTBS"
                        type="number"
                        step="0.01"
                        data-testid="input-volume-tbs-smallholders"
                        value={smallholdersForm.volumeTBS}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, volumeTBS: parseFloat(e.target.value) || 0 }))}
                        placeholder="Masukkan volume TBS dalam MT"
                      />
                    </div>
                  </div>
                </div>

                {/* Daftar Petani Pemasok TBS */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold border-b pb-2">Daftar Petani Pemasok TBS</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newPetani = {
                          no: smallholdersForm.daftarPetaniPemasok.length + 1,
                          namaPetani: '',
                          alamatTempatTinggal: '',
                          lokasiKebun: '',
                          luas: 0,
                          legalitasLahan: '',
                          tahunTanam: '',
                          stdb: '',
                          sppl: '',
                          nomorObjekPajakPBB: '',
                          longitude: '',
                          latitude: '',
                          polygon: ''
                        };
                        setSmallholdersForm(prev => ({
                          ...prev,
                          daftarPetaniPemasok: [...prev.daftarPetaniPemasok, newPetani]
                        }));
                      }}
                      data-testid="button-add-petani-pemasok"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Petani
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {smallholdersForm.daftarPetaniPemasok.map((petani, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="font-medium">Petani #{petani.no}</h5>
                          {smallholdersForm.daftarPetaniPemasok.length > 1 && (
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                const newDaftarPetani = smallholdersForm.daftarPetaniPemasok.filter((_, i) => i !== index);
                                // Renumber remaining petani
                                const renumbered = newDaftarPetani.map((p, i) => ({ ...p, no: i + 1 }));
                                setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasok: renumbered }));
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Nama Petani</Label>
                            <Input
                              value={petani.namaPetani}
                              onChange={(e) => {
                                const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasok];
                                newDaftarPetani[index].namaPetani = e.target.value;
                                setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasok: newDaftarPetani }));
                              }}
                              placeholder="Nama petani"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Alamat Tempat Tinggal</Label>
                            <Input
                              value={petani.alamatTempatTinggal}
                              onChange={(e) => {
                                const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasok];
                                newDaftarPetani[index].alamatTempatTinggal = e.target.value;
                                setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasok: newDaftarPetani }));
                              }}
                              placeholder="Alamat tempat tinggal"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Lokasi Kebun</Label>
                            <Input
                              value={petani.lokasiKebun}
                              onChange={(e) => {
                                const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasok];
                                newDaftarPetani[index].lokasiKebun = e.target.value;
                                setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasok: newDaftarPetani }));
                              }}
                              placeholder="Lokasi kebun"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Luas (Ha)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={petani.luas}
                              onChange={(e) => {
                                const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasok];
                                newDaftarPetani[index].luas = parseFloat(e.target.value) || 0;
                                setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasok: newDaftarPetani }));
                              }}
                              placeholder="Luas dalam Ha"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Tahun Tanam</Label>
                            <Input
                              value={petani.tahunTanam}
                              onChange={(e) => {
                                const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasok];
                                newDaftarPetani[index].tahunTanam = e.target.value;
                                setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasok: newDaftarPetani }));
                              }}
                              placeholder="Tahun tanam"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Longitude</Label>
                            <Input
                              value={petani.longitude}
                              onChange={(e) => {
                                const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasok];
                                newDaftarPetani[index].longitude = e.target.value;
                                setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasok: newDaftarPetani }));
                              }}
                              placeholder="Longitude"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Latitude</Label>
                            <Input
                              value={petani.latitude}
                              onChange={(e) => {
                                const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasok];
                                newDaftarPetani[index].latitude = e.target.value;
                                setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasok: newDaftarPetani }));
                              }}
                              placeholder="Latitude"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Polygon</Label>
                            <Input
                              value={petani.polygon}
                              onChange={(e) => {
                                const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasok];
                                newDaftarPetani[index].polygon = e.target.value;
                                setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasok: newDaftarPetani }));
                              }}
                              placeholder="Polygon data (opsional)"
                            />
                          </div>
                          
                          <div className="col-span-3 space-y-2">
                            <Label>Legalitas Lahan</Label>
                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label>STDB</Label>
                                  <Input
                                    value={petani.stdb}
                                    onChange={(e) => {
                                      const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasok];
                                      newDaftarPetani[index].stdb = e.target.value;
                                      setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasok: newDaftarPetani }));
                                    }}
                                    placeholder="Nomor STDB"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>SPPL</Label>
                                  <Input
                                    value={petani.sppl}
                                    onChange={(e) => {
                                      const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasok];
                                      newDaftarPetani[index].sppl = e.target.value;
                                      setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasok: newDaftarPetani }));
                                    }}
                                    placeholder="Nomor SPPL"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>Nomor Objek Pajak PBB</Label>
                                  <Input
                                    value={petani.nomorObjekPajakPBB}
                                    onChange={(e) => {
                                      const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasok];
                                      newDaftarPetani[index].nomorObjekPajakPBB = e.target.value;
                                      setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasok: newDaftarPetani }));
                                    }}
                                    placeholder="Nomor PBB"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createSmallholdersMutation.isPending} data-testid="button-submit-smallholders">
                    {createSmallholdersMutation.isPending ? 'Menyimpan...' : 'Simpan Data Smallholders'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {supplierType === 'mill' && (
          <Card>
            <CardHeader>
              <CardTitle>Formulir Pengumpulan Data Pabrik</CardTitle>
              <CardDescription>
                Data collection untuk Pabrik Kelapa Sawit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMillSubmit} className="space-y-8">
                {/* Bagian 1 - Informasi Umum */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 1 – Informasi Umum</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="umlId">UML ID</Label>
                      <Input
                        id="umlId"
                        data-testid="input-uml-id-mill"
                        value={millForm.umlId}
                        onChange={(e) => setMillForm(prev => ({ ...prev, umlId: e.target.value }))}
                        placeholder="Masukkan UML ID"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="namaPabrik">Nama Pabrik</Label>
                      <Input
                        id="namaPabrik"
                        data-testid="input-nama-pabrik-mill"
                        value={millForm.namaPabrik}
                        onChange={(e) => setMillForm(prev => ({ ...prev, namaPabrik: e.target.value }))}
                        placeholder="Masukkan nama pabrik"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="namaGroup">Nama Group / Parent Company Name</Label>
                    <Input
                      id="namaGroup"
                      data-testid="input-nama-group-mill"
                      value={millForm.namaGroup}
                      onChange={(e) => setMillForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                      placeholder="Masukkan nama group/parent company"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="izinBerusaha">Izin Berusaha (Nomor Induk Berusaha)</Label>
                    <Input
                      id="izinBerusaha"
                      data-testid="input-izin-berusaha-mill"
                      value={millForm.izinBerusaha}
                      onChange={(e) => setMillForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                      placeholder="Masukkan NIB"
                    />
                  </div>

                  {/* Alamat Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Alamat</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="alamatKantor">Kantor</Label>
                        <Textarea
                          id="alamatKantor"
                          data-testid="input-alamat-kantor-mill"
                          value={millForm.alamatKantor}
                          onChange={(e) => setMillForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                          placeholder="Masukkan alamat kantor lengkap"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="alamatPabrik">Pabrik</Label>
                        <Textarea
                          id="alamatPabrik"
                          data-testid="input-alamat-pabrik-mill"
                          value={millForm.alamatPabrik}
                          onChange={(e) => setMillForm(prev => ({ ...prev, alamatPabrik: e.target.value }))}
                          placeholder="Masukkan alamat pabrik lengkap"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Koordinat Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Koordinat</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="koordinatPabrik">Pabrik</Label>
                        <Input
                          id="koordinatPabrik"
                          data-testid="input-koordinat-pabrik-mill"
                          value={millForm.koordinatPabrik}
                          onChange={(e) => setMillForm(prev => ({ ...prev, koordinatPabrik: e.target.value }))}
                          placeholder="Latitude, Longitude"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="koordinatKantor">Kantor</Label>
                        <Input
                          id="koordinatKantor"
                          data-testid="input-koordinat-kantor-mill"
                          value={millForm.koordinatKantor}
                          onChange={(e) => setMillForm(prev => ({ ...prev, koordinatKantor: e.target.value }))}
                          placeholder="Latitude, Longitude"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Jenis Supplier Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Jenis Supplier</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={millForm.jenisSupplierKKPA}
                          onChange={(e) => setMillForm(prev => ({ ...prev, jenisSupplierKKPA: e.target.checked }))}
                          className="rounded"
                        />
                        <span>Kebun plasma yang dikelola penuh oleh perusahaan (KKPA)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={millForm.jenisSupplierSisterCompany}
                          onChange={(e) => setMillForm(prev => ({ ...prev, jenisSupplierSisterCompany: e.target.checked }))}
                          className="rounded"
                        />
                        <span>Kebun dalam satu grup manajemen (sister company)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={millForm.jenisSupplierPihakKetiga}
                          onChange={(e) => setMillForm(prev => ({ ...prev, jenisSupplierPihakKetiga: e.target.checked }))}
                          className="rounded"
                        />
                        <span>Kebun pihak ketiga (PT/ CV/ Koperasi)</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kuantitasCPOPK">Kuantitas CPO/PK (M/T)</Label>
                    <Input
                      id="kuantitasCPOPK"
                      data-testid="input-kuantitas-cpo-pk-mill"
                      value={millForm.kuantitasCPOPK}
                      onChange={(e) => setMillForm(prev => ({ ...prev, kuantitasCPOPK: e.target.value }))}
                      placeholder="Masukkan kuantitas dalam M/T"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tanggalPengisianKuisioner">Tanggal Pengisian Kuisioner</Label>
                    <Input
                      id="tanggalPengisianKuisioner"
                      type="date"
                      value={millForm.tanggalPengisianKuisioner}
                      onChange={(e) => setMillForm(prev => ({ ...prev, tanggalPengisianKuisioner: e.target.value }))}
                    />
                  </div>

                  {/* Tim Internal Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahaan</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="namaTimInternal">Nama</Label>
                        <Input
                          id="namaTimInternal"
                          value={millForm.namaTimInternal}
                          onChange={(e) => setMillForm(prev => ({ ...prev, namaTimInternal: e.target.value }))}
                          placeholder="Masukkan nama tim internal"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jabatanTimInternal">Jabatan</Label>
                        <Input
                          id="jabatanTimInternal"
                          value={millForm.jabatanTimInternal}
                          onChange={(e) => setMillForm(prev => ({ ...prev, jabatanTimInternal: e.target.value }))}
                          placeholder="Masukkan jabatan"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailTimInternal">Email</Label>
                        <Input
                          id="emailTimInternal"
                          type="email"
                          value={millForm.emailTimInternal}
                          onChange={(e) => setMillForm(prev => ({ ...prev, emailTimInternal: e.target.value }))}
                          placeholder="Masukkan email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nomorTelefonTimInternal">Nomor Telpon / Handphone</Label>
                        <Input
                          id="nomorTelefonTimInternal"
                          value={millForm.nomorTelefonTimInternal}
                          onChange={(e) => setMillForm(prev => ({ ...prev, nomorTelefonTimInternal: e.target.value }))}
                          placeholder="Masukkan nomor telepon"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Penanggung Jawab Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Penanggung Jawab</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="namaPenanggungJawab">Nama</Label>
                        <Input
                          id="namaPenanggungJawab"
                          value={millForm.namaPenanggungJawab}
                          onChange={(e) => setMillForm(prev => ({ ...prev, namaPenanggungJawab: e.target.value }))}
                          placeholder="Masukkan nama penanggung jawab"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jabatanPenanggungJawab">Jabatan</Label>
                        <Input
                          id="jabatanPenanggungJawab"
                          value={millForm.jabatanPenanggungJawab}
                          onChange={(e) => setMillForm(prev => ({ ...prev, jabatanPenanggungJawab: e.target.value }))}
                          placeholder="Masukkan jabatan"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailPenanggungJawab">Email</Label>
                        <Input
                          id="emailPenanggungJawab"
                          type="email"
                          value={millForm.emailPenanggungJawab}
                          onChange={(e) => setMillForm(prev => ({ ...prev, emailPenanggungJawab: e.target.value }))}
                          placeholder="Masukkan email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nomorTeleponPenanggungJawab">Nomor Telpon / Handphone</Label>
                        <Input
                          id="nomorTelefonPenanggungJawab"
                          value={millForm.nomorTelefonPenanggungJawab}
                          onChange={(e) => setMillForm(prev => ({ ...prev, nomorTelefonPenanggungJawab: e.target.value }))}
                          placeholder="Masukkan nomor telepon"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tanda Tangan Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Tanda Tangan</h4>
                    <div className="space-y-2">
                      <Label htmlFor="tandaTangan">TTD</Label>
                      <Input
                        id="tandaTangan"
                        value={millForm.tandaTangan}
                        onChange={(e) => setMillForm(prev => ({ ...prev, tandaTangan: e.target.value }))}
                        placeholder="Nama penandatangan"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 2 - Daftar Sumber TBS & Plot Produksi */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 2 – Daftar Sumber TBS & Plot Produksi</h3>
                  
                  {/* Kebun Inti */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-medium">Kebun Inti</h4>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const newKebun = {
                            namaSupplier: '',
                            alamat: '',
                            luasPlotLahan: 0,
                            longitude: '',
                            latitude: '',
                            polygonKebun: '',
                            persenPasokanKeMill: 0,
                            volumeTBSPasokan: '',
                            dokumenLegalitasLahan: '',
                            tahunTanam: ''
                          };
                          setMillForm(prev => ({
                            ...prev,
                            kebunInti: [...prev.kebunInti, newKebun]
                          }));
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Kebun Inti
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {millForm.kebunInti.map((kebun, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="font-medium">Kebun Inti #{index + 1}</h5>
                            {millForm.kebunInti.length > 1 && (
                              <Button 
                                type="button" 
                                variant="destructive" 
                                size="sm"
                                onClick={() => {
                                  const newKebunInti = millForm.kebunInti.filter((_, i) => i !== index);
                                  setMillForm(prev => ({ ...prev, kebunInti: newKebunInti }));
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Nama Supplier</Label>
                              <Input
                                value={kebun.namaSupplier}
                                onChange={(e) => {
                                  const newKebunInti = [...millForm.kebunInti];
                                  newKebunInti[index].namaSupplier = e.target.value;
                                  setMillForm(prev => ({ ...prev, kebunInti: newKebunInti }));
                                }}
                                placeholder="Nama supplier"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Alamat</Label>
                              <Input
                                value={kebun.alamat}
                                onChange={(e) => {
                                  const newKebunInti = [...millForm.kebunInti];
                                  newKebunInti[index].alamat = e.target.value;
                                  setMillForm(prev => ({ ...prev, kebunInti: newKebunInti }));
                                }}
                                placeholder="Alamat"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Luas Plot Lahan (Ha)</Label>
                              <Input
                                type="number"
                                value={kebun.luasPlotLahan}
                                onChange={(e) => {
                                  const newKebunInti = [...millForm.kebunInti];
                                  newKebunInti[index].luasPlotLahan = parseFloat(e.target.value) || 0;
                                  setMillForm(prev => ({ ...prev, kebunInti: newKebunInti }));
                                }}
                                placeholder="Luas dalam Ha"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Longitude</Label>
                              <Input
                                value={kebun.longitude}
                                onChange={(e) => {
                                  const newKebunInti = [...millForm.kebunInti];
                                  newKebunInti[index].longitude = e.target.value;
                                  setMillForm(prev => ({ ...prev, kebunInti: newKebunInti }));
                                }}
                                placeholder="Longitude"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Latitude</Label>
                              <Input
                                value={kebun.latitude}
                                onChange={(e) => {
                                  const newKebunInti = [...millForm.kebunInti];
                                  newKebunInti[index].latitude = e.target.value;
                                  setMillForm(prev => ({ ...prev, kebunInti: newKebunInti }));
                                }}
                                placeholder="Latitude"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Tahun Tanam</Label>
                              <Input
                                value={kebun.tahunTanam}
                                onChange={(e) => {
                                  const newKebunInti = [...millForm.kebunInti];
                                  newKebunInti[index].tahunTanam = e.target.value;
                                  setMillForm(prev => ({ ...prev, kebunInti: newKebunInti }));
                                }}
                                placeholder="Tahun tanam"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>% Pasokan ke Mill</Label>
                              <Input
                                type="number"
                                max="100"
                                value={kebun.persenPasokanKeMill}
                                onChange={(e) => {
                                  const newKebunInti = [...millForm.kebunInti];
                                  newKebunInti[index].persenPasokanKeMill = parseFloat(e.target.value) || 0;
                                  setMillForm(prev => ({ ...prev, kebunInti: newKebunInti }));
                                }}
                                placeholder="Persentase pasokan"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Volume TBS Pasokan</Label>
                              <Input
                                value={kebun.volumeTBSPasokan}
                                onChange={(e) => {
                                  const newKebunInti = [...millForm.kebunInti];
                                  newKebunInti[index].volumeTBSPasokan = e.target.value;
                                  setMillForm(prev => ({ ...prev, kebunInti: newKebunInti }));
                                }}
                                placeholder="Volume TBS"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Dokumen Legalitas Lahan</Label>
                              <Input
                                value={kebun.dokumenLegalitasLahan}
                                onChange={(e) => {
                                  const newKebunInti = [...millForm.kebunInti];
                                  newKebunInti[index].dokumenLegalitasLahan = e.target.value;
                                  setMillForm(prev => ({ ...prev, kebunInti: newKebunInti }));
                                }}
                                placeholder="HGU/HGB/dll"
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createMillMutation.isPending} data-testid="button-submit-mill">
                    {createMillMutation.isPending ? 'Menyimpan...' : 'Simpan Data Mill'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {supplierType === 'kcp' && (
          <Card>
            <CardHeader>
              <CardTitle>Formulir Pengumpulan Data KCP</CardTitle>
              <CardDescription>
                Data collection untuk Kernel Crushing Plant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleKcpSubmit} className="space-y-8">
                {/* Bagian 1 - Informasi Umum */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 1 – Informasi Umum</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="ublFacilityId">UBL Facility ID</Label>
                      <Input
                        id="ublFacilityId"
                        data-testid="input-ubl-facility-id-kcp"
                        value={kcpForm.ublFacilityId}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, ublFacilityId: e.target.value }))}
                        placeholder="Masukkan UBL Facility ID"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="namaKCP">Nama KCP</Label>
                      <Input
                        id="namaKCP"
                        data-testid="input-nama-kcp"
                        value={kcpForm.namaKCP}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, namaKCP: e.target.value }))}
                        placeholder="Masukkan nama KCP"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="namaGroup">Nama Group / Parent Company Name</Label>
                    <Input
                      id="namaGroup"
                      data-testid="input-nama-group-kcp"
                      value={kcpForm.namaGroup}
                      onChange={(e) => setKcpForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                      placeholder="Masukkan nama group/parent company"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="izinBerusaha">Izin Berusaha (Nomor Induk Berusaha)</Label>
                    <Input
                      id="izinBerusaha"
                      data-testid="input-izin-berusaha-kcp"
                      value={kcpForm.izinBerusaha}
                      onChange={(e) => setKcpForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                      placeholder="Masukkan NIB"
                    />
                  </div>

                  {/* Alamat Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Alamat</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="alamatKantor">Kantor</Label>
                        <Textarea
                          id="alamatKantor"
                          data-testid="input-alamat-kantor-kcp"
                          value={kcpForm.alamatKantor}
                          onChange={(e) => setKcpForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                          placeholder="Masukkan alamat kantor lengkap"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="alamatKCP">KCP</Label>
                        <Textarea
                          id="alamatKCP"
                          data-testid="input-alamat-kcp"
                          value={kcpForm.alamatKCP}
                          onChange={(e) => setKcpForm(prev => ({ ...prev, alamatKCP: e.target.value }))}
                          placeholder="Masukkan alamat KCP lengkap"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Koordinat Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Koordinat</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="koordinatKantor">Kantor</Label>
                        <Input
                          id="koordinatKantor"
                          data-testid="input-koordinat-kantor-kcp"
                          value={kcpForm.koordinatKantor}
                          onChange={(e) => setKcpForm(prev => ({ ...prev, koordinatKantor: e.target.value }))}
                          placeholder="Latitude, Longitude"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="koordinatKCP">KCP</Label>
                        <Input
                          id="koordinatKCP"
                          data-testid="input-koordinat-kcp"
                          value={kcpForm.koordinatKCP}
                          onChange={(e) => setKcpForm(prev => ({ ...prev, koordinatKCP: e.target.value }))}
                          placeholder="Latitude, Longitude"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="kapasitasOlahMTHari">Kapasitas Olah (MT/Hari)</Label>
                      <Input
                        id="kapasitasOlahMTHari"
                        type="number"
                        data-testid="input-kapasitas-olah-kcp"
                        value={kcpForm.kapasitasOlahMTHari}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, kapasitasOlahMTHari: parseFloat(e.target.value) || 0 }))}
                        placeholder="Masukkan kapasitas"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sistemPencatatan">Sistem Pencatatan</Label>
                      <Select
                        value={kcpForm.sistemPencatatan}
                        onValueChange={(value) => setKcpForm(prev => ({ ...prev, sistemPencatatan: value }))}
                      >
                        <SelectTrigger data-testid="select-sistem-pencatatan-kcp">
                          <SelectValue placeholder="Pilih sistem pencatatan..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LIFO">LIFO</SelectItem>
                          <SelectItem value="FIFO">FIFO</SelectItem>
                          <SelectItem value="Weighted">Weighted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tim Internal Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahaan</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="namaTimInternal">Nama</Label>
                        <Input
                          id="namaTimInternal"
                          value={kcpForm.namaTimInternal}
                          onChange={(e) => setKcpForm(prev => ({ ...prev, namaTimInternal: e.target.value }))}
                          placeholder="Masukkan nama tim internal"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jabatanTimInternal">Jabatan</Label>
                        <Input
                          id="jabatanTimInternal"
                          value={kcpForm.jabatanTimInternal}
                          onChange={(e) => setKcpForm(prev => ({ ...prev, jabatanTimInternal: e.target.value }))}
                          placeholder="Masukkan jabatan"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailTimInternal">Email</Label>
                        <Input
                          id="emailTimInternal"
                          type="email"
                          value={kcpForm.emailTimInternal}
                          onChange={(e) => setKcpForm(prev => ({ ...prev, emailTimInternal: e.target.value }))}
                          placeholder="Masukkan email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nomorTelefonTimInternal">Nomor Telpon / Handphone</Label>
                        <Input
                          id="nomorTelefonTimInternal"
                          value={kcpForm.nomorTelefonTimInternal}
                          onChange={(e) => setKcpForm(prev => ({ ...prev, nomorTelefonTimInternal: e.target.value }))}
                          placeholder="Masukkan nomor telepon"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Penanggung Jawab Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Penanggung Jawab</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="namaPenanggungJawab">Nama</Label>
                        <Input
                          id="namaPenanggungJawab"
                          value={kcpForm.namaPenanggungJawab}
                          onChange={(e) => setKcpForm(prev => ({ ...prev, namaPenanggungJawab: e.target.value }))}
                          placeholder="Masukkan nama penanggung jawab"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jabatanPenanggungJawab">Jabatan</Label>
                        <Input
                          id="jabatanPenanggungJawab"
                          value={kcpForm.jabatanPenanggungJawab}
                          onChange={(e) => setKcpForm(prev => ({ ...prev, jabatanPenanggungJawab: e.target.value }))}
                          placeholder="Masukkan jabatan"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailPenanggungJawab">Email</Label>
                        <Input
                          id="emailPenanggungJawab"
                          type="email"
                          value={kcpForm.emailPenanggungJawab}
                          onChange={(e) => setKcpForm(prev => ({ ...prev, emailPenanggungJawab: e.target.value }))}
                          placeholder="Masukkan email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nomorTelefonPenanggungJawab">Nomor Telpon / Handphone</Label>
                        <Input
                          id="nomorTelefonPenanggungJawab"
                          value={kcpForm.nomorTelefonPenanggungJawab}
                          onChange={(e) => setKcpForm(prev => ({ ...prev, nomorTelefonPenanggungJawab: e.target.value }))}
                          placeholder="Masukkan nomor telepon"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tanda Tangan Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Tanda Tangan</h4>
                    <div className="space-y-2">
                      <Label htmlFor="tandaTangan">TTD</Label>
                      <Input
                        id="tandaTangan"
                        value={kcpForm.tandaTangan}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, tandaTangan: e.target.value }))}
                        placeholder="Nama penandatangan"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 2 - Daftar Tangki / Silo */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold border-b pb-2">Bagian 2 – Daftar Tangki / Silo</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newTangki = {
                          idTangki: '',
                          kategori: '',
                          produk: '',
                          alamat: '',
                          longitude: '',
                          latitude: '',
                          kapasitas: 0
                        };
                        setKcpForm(prev => ({
                          ...prev,
                          daftarTangki: [...prev.daftarTangki, newTangki]
                        }));
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Tangki
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {kcpForm.daftarTangki.map((tangki, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="font-medium">Tangki #{index + 1}</h5>
                          {kcpForm.daftarTangki.length > 1 && (
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                const newDaftarTangki = kcpForm.daftarTangki.filter((_, i) => i !== index);
                                setKcpForm(prev => ({ ...prev, daftarTangki: newDaftarTangki }));
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>ID Tangki</Label>
                            <Input
                              value={tangki.idTangki}
                              onChange={(e) => {
                                const newDaftarTangki = [...kcpForm.daftarTangki];
                                newDaftarTangki[index].idTangki = e.target.value;
                                setKcpForm(prev => ({ ...prev, daftarTangki: newDaftarTangki }));
                              }}
                              placeholder="ID Tangki"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Kategori</Label>
                            <Select
                              value={tangki.kategori}
                              onValueChange={(value) => {
                                const newDaftarTangki = [...kcpForm.daftarTangki];
                                newDaftarTangki[index].kategori = value;
                                setKcpForm(prev => ({ ...prev, daftarTangki: newDaftarTangki }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih kategori..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Raw Kernel">Raw Kernel</SelectItem>
                                <SelectItem value="PKO">PKO</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Produk</Label>
                            <Input
                              value={tangki.produk}
                              onChange={(e) => {
                                const newDaftarTangki = [...kcpForm.daftarTangki];
                                newDaftarTangki[index].produk = e.target.value;
                                setKcpForm(prev => ({ ...prev, daftarTangki: newDaftarTangki }));
                              }}
                              placeholder="Nama produk"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Alamat</Label>
                            <Input
                              value={tangki.alamat}
                              onChange={(e) => {
                                const newDaftarTangki = [...kcpForm.daftarTangki];
                                newDaftarTangki[index].alamat = e.target.value;
                                setKcpForm(prev => ({ ...prev, daftarTangki: newDaftarTangki }));
                              }}
                              placeholder="Alamat tangki"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Longitude</Label>
                            <Input
                              value={tangki.longitude}
                              onChange={(e) => {
                                const newDaftarTangki = [...kcpForm.daftarTangki];
                                newDaftarTangki[index].longitude = e.target.value;
                                setKcpForm(prev => ({ ...prev, daftarTangki: newDaftarTangki }));
                              }}
                              placeholder="Longitude"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Latitude</Label>
                            <Input
                              value={tangki.latitude}
                              onChange={(e) => {
                                const newDaftarTangki = [...kcpForm.daftarTangki];
                                newDaftarTangki[index].latitude = e.target.value;
                                setKcpForm(prev => ({ ...prev, daftarTangki: newDaftarTangki }));
                              }}
                              placeholder="Latitude"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Kapasitas</Label>
                            <Input
                              type="number"
                              value={tangki.kapasitas}
                              onChange={(e) => {
                                const newDaftarTangki = [...kcpForm.daftarTangki];
                                newDaftarTangki[index].kapasitas = parseFloat(e.target.value) || 0;
                                setKcpForm(prev => ({ ...prev, daftarTangki: newDaftarTangki }));
                              }}
                              placeholder="Kapasitas tangki"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Bagian 3 - Sumber Produk */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold border-b pb-2">Bagian 3 – Sumber Produk</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newSumber = {
                          millId: '',
                          namaPKS: '',
                          alamat: '',
                          longitude: '',
                          latitude: '',
                          produk: '',
                          volume: 0
                        };
                        setKcpForm(prev => ({
                          ...prev,
                          sumberProduk: [...prev.sumberProduk, newSumber]
                        }));
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Sumber
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {kcpForm.sumberProduk.map((sumber, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="font-medium">Sumber Produk #{index + 1}</h5>
                          {kcpForm.sumberProduk.length > 1 && (
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                const newSumberProduk = kcpForm.sumberProduk.filter((_, i) => i !== index);
                                setKcpForm(prev => ({ ...prev, sumberProduk: newSumberProduk }));
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Mill ID</Label>
                            <Input
                              value={sumber.millId}
                              onChange={(e) => {
                                const newSumberProduk = [...kcpForm.sumberProduk];
                                newSumberProduk[index].millId = e.target.value;
                                setKcpForm(prev => ({ ...prev, sumberProduk: newSumberProduk }));
                              }}
                              placeholder="Mill ID"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Nama PKS</Label>
                            <Input
                              value={sumber.namaPKS}
                              onChange={(e) => {
                                const newSumberProduk = [...kcpForm.sumberProduk];
                                newSumberProduk[index].namaPKS = e.target.value;
                                setKcpForm(prev => ({ ...prev, sumberProduk: newSumberProduk }));
                              }}
                              placeholder="Nama PKS"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Alamat</Label>
                            <Input
                              value={sumber.alamat}
                              onChange={(e) => {
                                const newSumberProduk = [...kcpForm.sumberProduk];
                                newSumberProduk[index].alamat = e.target.value;
                                setKcpForm(prev => ({ ...prev, sumberProduk: newSumberProduk }));
                              }}
                              placeholder="Alamat PKS"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Longitude</Label>
                            <Input
                              value={sumber.longitude}
                              onChange={(e) => {
                                const newSumberProduk = [...kcpForm.sumberProduk];
                                newSumberProduk[index].longitude = e.target.value;
                                setKcpForm(prev => ({ ...prev, sumberProduk: newSumberProduk }));
                              }}
                              placeholder="Longitude"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Latitude</Label>
                            <Input
                              value={sumber.latitude}
                              onChange={(e) => {
                                const newSumberProduk = [...kcpForm.sumberProduk];
                                newSumberProduk[index].latitude = e.target.value;
                                setKcpForm(prev => ({ ...prev, sumberProduk: newSumberProduk }));
                              }}
                              placeholder="Latitude"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Produk</Label>
                            <Input
                              value={sumber.produk}
                              onChange={(e) => {
                                const newSumberProduk = [...kcpForm.sumberProduk];
                                newSumberProduk[index].produk = e.target.value;
                                setKcpForm(prev => ({ ...prev, sumberProduk: newSumberProduk }));
                              }}
                              placeholder="Jenis produk"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Volume</Label>
                            <Input
                              type="number"
                              value={sumber.volume}
                              onChange={(e) => {
                                const newSumberProduk = [...kcpForm.sumberProduk];
                                newSumberProduk[index].volume = parseFloat(e.target.value) || 0;
                                setKcpForm(prev => ({ ...prev, sumberProduk: newSumberProduk }));
                              }}
                              placeholder="Volume produk"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createKcpMutation.isPending} data-testid="button-submit-kcp">
                    {createKcpMutation.isPending ? 'Menyimpan...' : 'Simpan Data KCP'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {supplierType === 'bulking' && (
          <Card>
            <CardHeader>
              <CardTitle>Formulir Pengumpulan Data Bulking</CardTitle>
              <CardDescription>
                Data collection untuk Fasilitas Bulking/Storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBulkingSubmit} className="space-y-8">
                {/* Bagian 1 - Informasi Umum */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 1 – Informasi Umum</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="ublFacilityId">UBL Facility ID</Label>
                      <Input
                        id="ublFacilityId"
                        data-testid="input-ubl-facility-id-bulking"
                        value={bulkingForm.ublFacilityId}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, ublFacilityId: e.target.value }))}
                        placeholder="Masukkan UBL Facility ID"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="namaFasilitasBulking">Nama Fasilitas Bulking</Label>
                      <Input
                        id="namaFasilitasBulking"
                        data-testid="input-nama-fasilitas-bulking"
                        value={bulkingForm.namaFasilitasBulking}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, namaFasilitasBulking: e.target.value }))}
                        placeholder="Masukkan nama fasilitas"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="namaGroup">Nama Group / Parent Company Name</Label>
                    <Input
                      id="namaGroup"
                      data-testid="input-nama-group-bulking"
                      value={bulkingForm.namaGroup}
                      onChange={(e) => setBulkingForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                      placeholder="Masukkan nama group/parent company"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="izinBerusaha">Izin Berusaha (Nomor Induk Berusaha)</Label>
                    <Input
                      id="izinBerusaha"
                      data-testid="input-izin-berusaha-bulking"
                      value={bulkingForm.izinBerusaha}
                      onChange={(e) => setBulkingForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                      placeholder="Masukkan NIB"
                    />
                  </div>

                  {/* Alamat Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Alamat</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="alamatKantor">Kantor</Label>
                        <Textarea
                          id="alamatKantor"
                          data-testid="input-alamat-kantor-bulking"
                          value={bulkingForm.alamatKantor}
                          onChange={(e) => setBulkingForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                          placeholder="Masukkan alamat kantor lengkap"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="alamatFasilitas">Fasilitas</Label>
                        <Textarea
                          id="alamatFasilitas"
                          data-testid="input-alamat-fasilitas-bulking"
                          value={bulkingForm.alamatFasilitas}
                          onChange={(e) => setBulkingForm(prev => ({ ...prev, alamatFasilitas: e.target.value }))}
                          placeholder="Masukkan alamat fasilitas lengkap"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Koordinat Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Koordinat</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="koordinatKantor">Kantor</Label>
                        <Input
                          id="koordinatKantor"
                          data-testid="input-koordinat-kantor-bulking"
                          value={bulkingForm.koordinatKantor}
                          onChange={(e) => setBulkingForm(prev => ({ ...prev, koordinatKantor: e.target.value }))}
                          placeholder="Latitude, Longitude"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="koordinatFasilitas">Fasilitas</Label>
                        <Input
                          id="koordinatFasilitas"
                          data-testid="input-koordinat-fasilitas-bulking"
                          value={bulkingForm.koordinatFasilitas}
                          onChange={(e) => setBulkingForm(prev => ({ ...prev, koordinatFasilitas: e.target.value }))}
                          placeholder="Latitude, Longitude"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="sistemPencatatan">Sistem Pencatatan</Label>
                      <Select
                        value={bulkingForm.sistemPencatatan}
                        onValueChange={(value) => setBulkingForm(prev => ({ ...prev, sistemPencatatan: value }))}
                      >
                        <SelectTrigger data-testid="select-sistem-pencatatan-bulking">
                          <SelectValue placeholder="Pilih sistem pencatatan..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LIFO">LIFO</SelectItem>
                          <SelectItem value="FIFO">FIFO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tanggalPengisianKuisioner">Tanggal Pengisian Kuisioner</Label>
                      <Input
                        id="tanggalPengisianKuisioner"
                        type="date"
                        value={bulkingForm.tanggalPengisianKuisioner}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, tanggalPengisianKuisioner: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Tim Internal Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahaan</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="namaTimInternal">Nama</Label>
                        <Input
                          id="namaTimInternal"
                          value={bulkingForm.namaTimInternal}
                          onChange={(e) => setBulkingForm(prev => ({ ...prev, namaTimInternal: e.target.value }))}
                          placeholder="Masukkan nama tim internal"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jabatanTimInternal">Jabatan</Label>
                        <Input
                          id="jabatanTimInternal"
                          value={bulkingForm.jabatanTimInternal}
                          onChange={(e) => setBulkingForm(prev => ({ ...prev, jabatanTimInternal: e.target.value }))}
                          placeholder="Masukkan jabatan"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailTimInternal">Email</Label>
                        <Input
                          id="emailTimInternal"
                          type="email"
                          value={bulkingForm.emailTimInternal}
                          onChange={(e) => setBulkingForm(prev => ({ ...prev, emailTimInternal: e.target.value }))}
                          placeholder="Masukkan email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nomorTelefonTimInternal">Nomor Telpon / Handphone</Label>
                        <Input
                          id="nomorTelefonTimInternal"
                          value={bulkingForm.nomorTelefonTimInternal}
                          onChange={(e) => setBulkingForm(prev => ({ ...prev, nomorTelefonTimInternal: e.target.value }))}
                          placeholder="Masukkan nomor telepon"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Penanggung Jawab Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Penanggung Jawab</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="namaPenanggungJawab">Nama</Label>
                        <Input
                          id="namaPenanggungJawab"
                          value={bulkingForm.namaPenanggungJawab}
                          onChange={(e) => setBulkingForm(prev => ({ ...prev, namaPenanggungJawab: e.target.value }))}
                          placeholder="Masukkan nama penanggung jawab"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jabatanPenanggungJawab">Jabatan</Label>
                        <Input
                          id="jabatanPenanggungJawab"
                          value={bulkingForm.jabatanPenanggungJawab}
                          onChange={(e) => setBulkingForm(prev => ({ ...prev, jabatanPenanggungJawab: e.target.value }))}
                          placeholder="Masukkan jabatan"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailPenanggungJawab">Email</Label>
                        <Input
                          id="emailPenanggungJawab"
                          type="email"
                          value={bulkingForm.emailPenanggungJawab}
                          onChange={(e) => setBulkingForm(prev => ({ ...prev, emailPenanggungJawab: e.target.value }))}
                          placeholder="Masukkan email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nomorTelefonPenanggungJawab">Nomor Telpon / Handphone</Label>
                        <Input
                          id="nomorTelefonPenanggungJawab"
                          value={bulkingForm.nomorTelefonPenanggungJawab}
                          onChange={(e) => setBulkingForm(prev => ({ ...prev, nomorTelefonPenanggungJawab: e.target.value }))}
                          placeholder="Masukkan nomor telepon"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tanda Tangan Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Tanda Tangan</h4>
                    <div className="space-y-2">
                      <Label htmlFor="tandaTangan">TTD</Label>
                      <Input
                        id="tandaTangan"
                        value={bulkingForm.tandaTangan}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, tandaTangan: e.target.value }))}
                        placeholder="Nama penandatangan"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 2 - Daftar Tangki */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold border-b pb-2">Bagian 2 – Daftar Tangki</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newTangki = {
                          tankId: '',
                          produk: '',
                          kapasitas: 0,
                          longitude: '',
                          latitude: ''
                        };
                        setBulkingForm(prev => ({
                          ...prev,
                          daftarTangki: [...prev.daftarTangki, newTangki]
                        }));
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Tangki
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {bulkingForm.daftarTangki.map((tangki, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="font-medium">Tangki #{index + 1}</h5>
                          {bulkingForm.daftarTangki.length > 1 && (
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                const newDaftarTangki = bulkingForm.daftarTangki.filter((_, i) => i !== index);
                                setBulkingForm(prev => ({ ...prev, daftarTangki: newDaftarTangki }));
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Tank ID</Label>
                            <Input
                              value={tangki.tankId}
                              onChange={(e) => {
                                const newDaftarTangki = [...bulkingForm.daftarTangki];
                                newDaftarTangki[index].tankId = e.target.value;
                                setBulkingForm(prev => ({ ...prev, daftarTangki: newDaftarTangki }));
                              }}
                              placeholder="Tank ID"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Produk</Label>
                            <Input
                              value={tangki.produk}
                              onChange={(e) => {
                                const newDaftarTangki = [...bulkingForm.daftarTangki];
                                newDaftarTangki[index].produk = e.target.value;
                                setBulkingForm(prev => ({ ...prev, daftarTangki: newDaftarTangki }));
                              }}
                              placeholder="Nama produk"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Kapasitas</Label>
                            <Input
                              type="number"
                              value={tangki.kapasitas}
                              onChange={(e) => {
                                const newDaftarTangki = [...bulkingForm.daftarTangki];
                                newDaftarTangki[index].kapasitas = parseFloat(e.target.value) || 0;
                                setBulkingForm(prev => ({ ...prev, daftarTangki: newDaftarTangki }));
                              }}
                              placeholder="Kapasitas tangki"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Longitude</Label>
                            <Input
                              value={tangki.longitude}
                              onChange={(e) => {
                                const newDaftarTangki = [...bulkingForm.daftarTangki];
                                newDaftarTangki[index].longitude = e.target.value;
                                setBulkingForm(prev => ({ ...prev, daftarTangki: newDaftarTangki }));
                              }}
                              placeholder="Longitude"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Latitude</Label>
                            <Input
                              value={tangki.latitude}
                              onChange={(e) => {
                                const newDaftarTangki = [...bulkingForm.daftarTangki];
                                newDaftarTangki[index].latitude = e.target.value;
                                setBulkingForm(prev => ({ ...prev, daftarTangki: newDaftarTangki }));
                              }}
                              placeholder="Latitude"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Bagian 3 - Sumber Produk */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold border-b pb-2">Bagian 3 – Sumber Produk</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newSumber = {
                          millId: '',
                          namaPKS: '',
                          alamat: '',
                          longitude: '',
                          latitude: '',
                          produk: '',
                          volume: 0
                        };
                        setBulkingForm(prev => ({
                          ...prev,
                          sumberProduk: [...prev.sumberProduk, newSumber]
                        }));
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Sumber
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {bulkingForm.sumberProduk.map((sumber, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="font-medium">Sumber Produk #{index + 1}</h5>
                          {bulkingForm.sumberProduk.length > 1 && (
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                const newSumberProduk = bulkingForm.sumberProduk.filter((_, i) => i !== index);
                                setBulkingForm(prev => ({ ...prev, sumberProduk: newSumberProduk }));
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Mill ID</Label>
                            <Input
                              value={sumber.millId}
                              onChange={(e) => {
                                const newSumberProduk = [...bulkingForm.sumberProduk];
                                newSumberProduk[index].millId = e.target.value;
                                setBulkingForm(prev => ({ ...prev, sumberProduk: newSumberProduk }));
                              }}
                              placeholder="Mill ID"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Nama PKS</Label>
                            <Input
                              value={sumber.namaPKS}
                              onChange={(e) => {
                                const newSumberProduk = [...bulkingForm.sumberProduk];
                                newSumberProduk[index].namaPKS = e.target.value;
                                setBulkingForm(prev => ({ ...prev, sumberProduk: newSumberProduk }));
                              }}
                              placeholder="Nama PKS"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Alamat</Label>
                            <Input
                              value={sumber.alamat}
                              onChange={(e) => {
                                const newSumberProduk = [...bulkingForm.sumberProduk];
                                newSumberProduk[index].alamat = e.target.value;
                                setBulkingForm(prev => ({ ...prev, sumberProduk: newSumberProduk }));
                              }}
                              placeholder="Alamat PKS"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Longitude</Label>
                            <Input
                              value={sumber.longitude}
                              onChange={(e) => {
                                const newSumberProduk = [...bulkingForm.sumberProduk];
                                newSumberProduk[index].longitude = e.target.value;
                                setBulkingForm(prev => ({ ...prev, sumberProduk: newSumberProduk }));
                              }}
                              placeholder="Longitude"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Latitude</Label>
                            <Input
                              value={sumber.latitude}
                              onChange={(e) => {
                                const newSumberProduk = [...bulkingForm.sumberProduk];
                                newSumberProduk[index].latitude = e.target.value;
                                setBulkingForm(prev => ({ ...prev, sumberProduk: newSumberProduk }));
                              }}
                              placeholder="Latitude"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Produk</Label>
                            <Input
                              value={sumber.produk}
                              onChange={(e) => {
                                const newSumberProduk = [...bulkingForm.sumberProduk];
                                newSumberProduk[index].produk = e.target.value;
                                setBulkingForm(prev => ({ ...prev, sumberProduk: newSumberProduk }));
                              }}
                              placeholder="Jenis produk"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Volume</Label>
                            <Input
                              type="number"
                              value={sumber.volume}
                              onChange={(e) => {
                                const newSumberProduk = [...bulkingForm.sumberProduk];
                                newSumberProduk[index].volume = parseFloat(e.target.value) || 0;
                                setBulkingForm(prev => ({ ...prev, sumberProduk: newSumberProduk }));
                              }}
                              placeholder="Volume produk"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createBulkingMutation.isPending} data-testid="button-submit-bulking">
                    {createBulkingMutation.isPending ? 'Menyimpan...' : 'Simpan Data Bulking'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* View Consolidated Results CTA - Show when any supplier type is selected */}
        {supplierType && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">
                    View Consolidated Assessment Results
                  </h3>
                  <p className="text-blue-700 mb-4 max-w-2xl mx-auto">
                    Review comprehensive supplier assessments with AI-powered analysis, compliance scoring, and risk evaluation across all your data collection efforts.
                  </p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/supply-chain-analysis'}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 font-medium"
                  data-testid="button-view-consolidated-results"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  View Consolidated Results & Analysis
                  <span className="ml-2">→</span>
                </Button>
                <p className="text-sm text-blue-600 mt-2">
                  Access detailed reports, compliance status, and risk assessments
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}